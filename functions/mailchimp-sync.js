/*!
 * functions/mailchimp-sync.js — Pixy Dust Seasoning
 * Lead capture: inserts a row into Supabase `leads` table, then upserts the
 * contact in Mailchimp and applies the correct tag.
 *
 * Required env vars (set in Netlify dashboard):
 *   MAILCHIMP_API_KEY        — Mailchimp API key
 *   MAILCHIMP_SERVER_PREFIX  — e.g. "us21"
 *   MAILCHIMP_AUDIENCE_ID    — Mailchimp list/audience ID
 *   SUPABASE_URL             — Supabase project URL
 *   SUPABASE_ANON_KEY        — Supabase public anon key
 *   SUPABASE_SERVICE_ROLE_KEY — Supabase service role key (bypasses RLS)
 *
 * POST body: { email, name?, tag?, source? }
 * Returns:   { ok, supabase, mailchimp }
 *   Always returns HTTP 200 — Mailchimp failure does NOT block the UX.
 */

"use strict";

var crypto = require("crypto");

var CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type":                 "application/json"
};

function md5(str) {
  return crypto.createHash("md5").update(String(str).toLowerCase()).digest("hex");
}

function stripTrailingSlash(s) {
  return typeof s === "string" && s.endsWith("/") ? s.slice(0, -1) : s;
}

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: "Method not allowed" })
    };
  }

  var body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: "Invalid JSON body" })
    };
  }

  var email  = (typeof body.email  === "string") ? body.email.trim().toLowerCase()  : "";
  var name   = (typeof body.name   === "string") ? body.name.trim()                  : "";
  var tag    = (typeof body.tag    === "string") ? body.tag.trim()                   : "VIP";
  var source = (typeof body.source === "string") ? body.source.trim()                : "popup";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: "Invalid email address" })
    };
  }

  var supabaseOk  = false;
  var mailchimpOk = false;
  var errors      = [];

  // ── 1. Supabase INSERT into leads table ──────────────────────────────────
  var sbUrl        = process.env.SUPABASE_URL;
  var sbServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  var sbAnonKey    = process.env.SUPABASE_ANON_KEY;

  if (sbUrl && sbServiceKey && sbAnonKey) {
    var leadsEndpoint = stripTrailingSlash(sbUrl) + "/rest/v1/leads";
    try {
      var sbRes = await fetch(leadsEndpoint, {
        method:  "POST",
        headers: {
          apikey:          sbAnonKey,
          Authorization:   "Bearer " + sbServiceKey,
          "Content-Type":  "application/json",
          Prefer:          "return=minimal"
        },
        body: JSON.stringify({ email: email, name: name, tag: tag, source: source })
      });
      if (sbRes.ok || sbRes.status === 201) {
        supabaseOk = true;
      } else {
        var sbText = await sbRes.text().catch(function () { return ""; });
        errors.push("Supabase (" + sbRes.status + "): " + sbText.slice(0, 200));
        console.warn("[mailchimp-sync] Supabase insert failed:", sbRes.status, sbText.slice(0, 200));
      }
    } catch (sbErr) {
      errors.push("Supabase network: " + sbErr.message);
      console.warn("[mailchimp-sync] Supabase error:", sbErr.message);
    }
  } else {
    errors.push("Supabase env vars not configured");
    console.warn("[mailchimp-sync] Supabase env vars missing");
  }

  // ── 2. Mailchimp PUT (upsert) + tag ──────────────────────────────────────
  var mcKey      = process.env.MAILCHIMP_API_KEY;
  var mcServer   = process.env.MAILCHIMP_SERVER_PREFIX;
  var mcAudience = process.env.MAILCHIMP_AUDIENCE_ID;

  if (mcKey && mcServer && mcAudience) {
    var hash      = md5(email);
    var authHeader = "Basic " + Buffer.from("anystring:" + mcKey).toString("base64");
    var mcBase    = "https://" + mcServer + ".api.mailchimp.com/3.0/lists/" + mcAudience;
    var memberUrl = mcBase + "/members/" + hash;
    var tagUrl    = mcBase + "/members/" + hash + "/tags";

    var nameParts  = name ? name.split(/\s+/) : [];
    var mergeFields = {};
    if (nameParts[0]) mergeFields.FNAME = nameParts[0];
    if (nameParts.length > 1) mergeFields.LNAME = nameParts.slice(1).join(" ");

    try {
      var mcRes = await fetch(memberUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization:  authHeader
        },
        body: JSON.stringify({
          email_address: email,
          status_if_new: "subscribed",
          status:        "subscribed",
          merge_fields:  mergeFields
        })
      });

      if (mcRes.ok) {
        // Apply tag after successful upsert
        var tagRes = await fetch(tagUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:  authHeader
          },
          body: JSON.stringify({
            tags: [{ name: tag, status: "active" }]
          })
        });
        if (tagRes.ok || tagRes.status === 204) {
          mailchimpOk = true;
        } else {
          var tagText = await tagRes.text().catch(function () { return ""; });
          errors.push("Mailchimp tag (" + tagRes.status + "): " + tagText.slice(0, 200));
          console.warn("[mailchimp-sync] Mailchimp tag failed:", tagRes.status);
          mailchimpOk = true; // member was added; tag failure is non-fatal
        }
      } else {
        var mcText = await mcRes.text().catch(function () { return ""; });
        errors.push("Mailchimp member (" + mcRes.status + "): " + mcText.slice(0, 200));
        console.warn("[mailchimp-sync] Mailchimp upsert failed:", mcRes.status, mcText.slice(0, 200));
      }
    } catch (mcErr) {
      errors.push("Mailchimp network: " + mcErr.message);
      console.warn("[mailchimp-sync] Mailchimp error:", mcErr.message);
    }
  } else {
    errors.push("Mailchimp env vars not configured");
    console.warn("[mailchimp-sync] Mailchimp env vars missing");
  }

  if (errors.length) {
    console.warn("[mailchimp-sync] errors for", email, "—", errors.join("; "));
  }

  // Always return 200 — Mailchimp failures must not block the frontend UX.
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      ok:        supabaseOk || mailchimpOk,
      supabase:  supabaseOk,
      mailchimp: mailchimpOk
    })
  };
};
