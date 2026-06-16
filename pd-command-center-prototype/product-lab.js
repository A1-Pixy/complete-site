/* ============================================
   PD SEASONING — AI PRODUCT & FULFILLMENT LAB
   product-lab.js  |  Mock data only — no live APIs
   ============================================ */

// ============================================================
// MOCK DATA
// ============================================================
const PL_PRODUCTS = [
  { id:'p1', name:'Smoke House BBQ Grill Set',    category:'Grilling Tools',      supplierName:'KitchenPro Supply', productCost:8.50,  shippingCost:4.00, retailPrice:29.99, paymentFee:1.20, packagingCost:1.00, estimatedAdCost:5.00, brandFitScore:9, demandScore:8, riskScore:2, status:'Approved for Test', sampleStatus:'Received',    approvalStatus:'Pending',  notes:'Pairs with Smoke House blend. Sample looks premium.' },
  { id:'p2', name:'Charcuterie Serving Board',    category:'Kitchen Accessories', supplierName:'WoodCraft Direct',  productCost:12.00, shippingCost:5.50, retailPrice:44.99, paymentFee:1.80, packagingCost:2.00, estimatedAdCost:7.00, brandFitScore:8, demandScore:7, riskScore:3, status:'Researching',      sampleStatus:'Not Ordered', approvalStatus:'Pending',  notes:'Good bundle with ChopHouse blend.' },
  { id:'p3', name:'PD Apron — Black & Gold',      category:'Merch',               supplierName:'ApparelBase',       productCost:9.00,  shippingCost:3.50, retailPrice:34.99, paymentFee:1.40, packagingCost:1.50, estimatedAdCost:6.00, brandFitScore:10,demandScore:8, riskScore:2, status:'Sample Needed',     sampleStatus:'Not Ordered', approvalStatus:'Pending',  notes:'Black & gold colorway matches brand perfectly.' },
  { id:'p4', name:'Seafood Night Gift Box',       category:'Gift Packaging',      supplierName:'GiftBox Co',        productCost:5.00,  shippingCost:3.00, retailPrice:14.99, paymentFee:0.60, packagingCost:0.50, estimatedAdCost:3.00, brandFitScore:9, demandScore:9, riskScore:1, status:'Live',             sampleStatus:'Approved',    approvalStatus:'Approved', notes:'Bundles with Deep Blue Seafood blend.' },
  { id:'p5', name:'Steak Thermometer Pro',        category:'Kitchen Tools',       supplierName:'ThermoTech',        productCost:11.00, shippingCost:4.00, retailPrice:32.99, paymentFee:1.32, packagingCost:1.50, estimatedAdCost:6.00, brandFitScore:7, demandScore:7, riskScore:4, status:'New',              sampleStatus:'Not Ordered', approvalStatus:'Pending',  notes:'ChopHouse bundle candidate.' },
  { id:'p6', name:'Measuring Spoon Set — Gold',   category:'Kitchen Accessories', supplierName:'KitchenPro Supply', productCost:4.50,  shippingCost:2.50, retailPrice:18.99, paymentFee:0.76, packagingCost:0.75, estimatedAdCost:3.50, brandFitScore:8, demandScore:8, riskScore:1, status:'Approved for Test', sampleStatus:'Approved',    approvalStatus:'Pending',  notes:'Gold finish matches brand perfectly.' },
];

const PL_SUPPLIERS = [
  { id:'s1', name:'KitchenPro Supply', platform:'Faire',   contact:'orders@kitchenpro.com',     shippingTime:'4–6 days',  returnPolicy:'30-day returns',  sampleOrdered:true,  sampleReceived:true,  qualityApproved:true,  backupSupplier:'CulinarySource', status:'Approved',      notes:'Reliable. Good quality control.' },
  { id:'s2', name:'WoodCraft Direct',  platform:'Alibaba', contact:'sales@woodcraftdirect.com', shippingTime:'7–10 days', returnPolicy:'No returns',      sampleOrdered:false, sampleReceived:false, qualityApproved:false, backupSupplier:'',               status:'Contacted',     notes:'Need sample. Shipping time borderline.' },
  { id:'s3', name:'ApparelBase',       platform:'Printful',contact:'api@printful.com',          shippingTime:'3–5 days',  returnPolicy:'Exchange only',   sampleOrdered:true,  sampleReceived:false, qualityApproved:false, backupSupplier:'Printify',       status:'Sample Ordered',notes:'Print-on-demand. No inventory risk.' },
  { id:'s4', name:'GiftBox Co',        platform:'Direct',  contact:'wholesale@giftboxco.com',   shippingTime:'2–4 days',  returnPolicy:'14-day returns',  sampleOrdered:true,  sampleReceived:true,  qualityApproved:true,  backupSupplier:'PackagingHub',   status:'Approved',      notes:'Fast ship. Minimum order 50 units.' },
];

const PL_ORDERS = [
  { id:'o1', customerName:'Marcus T.', productName:'Seafood Night Gift Box',      orderStatus:'In Transit',           supplierOrderStatus:'Shipped',    trackingNumber:'9400111899223456789', expectedDelivery:'2026-06-17', lateFlag:false, refundRisk:'Low',    supportNotes:'' },
  { id:'o2', customerName:'Priya S.',  productName:'Smoke House BBQ Grill Set',  orderStatus:'Supplier Order Needed',supplierOrderStatus:'Not Placed', trackingNumber:'',                    expectedDelivery:'2026-06-20', lateFlag:false, refundRisk:'Medium', supportNotes:'Waiting on supplier confirmation.' },
  { id:'o3', customerName:'Dana K.',   productName:'Seafood Night Gift Box',      orderStatus:'Delivered',            supplierOrderStatus:'Delivered',  trackingNumber:'9400111899223456001', expectedDelivery:'2026-06-14', lateFlag:false, refundRisk:'None',   supportNotes:'' },
  { id:'o4', customerName:'James R.',  productName:'Measuring Spoon Set — Gold', orderStatus:'Issue',                supplierOrderStatus:'Delivered',  trackingNumber:'9400111899223456002', expectedDelivery:'2026-06-13', lateFlag:true,  refundRisk:'High',   supportNotes:'Customer reports item missing from box.' },
];

const PL_APPROVALS = [
  { id:'a1', type:'Supplier Approval',         item:'WoodCraft Direct',                        detail:'New supplier — Alibaba. 7–10 day shipping. No return policy. Sample not yet ordered.',        status:'Pending' },
  { id:'a2', type:'Sample Approval',            item:'PD Apron — Black & Gold (ApparelBase)',   detail:'Sample ordered from Printful. Awaiting receipt for quality check.',                            status:'Pending' },
  { id:'a3', type:'Product Listing Approval',   item:'Smoke House BBQ Grill Set',               detail:'Listing draft complete. Retail: $29.99. Margin: 34%. Brand fit: 9/10.',                       status:'Needs Review' },
  { id:'a4', type:'Launch Approval',            item:'Measuring Spoon Set — Gold',              detail:'Ready to launch. Supplier approved. Sample approved. Margin: 47%.',                           status:'Pending' },
  { id:'a5', type:'Refund Approval',            item:'James R. — Measuring Spoon Set',          detail:'Customer reports missing item. Order #o4. Refund or replace?',                                status:'Pending' },
];

const PL_AGENTS = [
  { id:'product-scout', name:'Product Scout Agent', status:'Online', tasks:['Find product ideas', 'Score brand fit', 'Suggest bundle ideas'] },
  { id:'supplier',      name:'Supplier Agent',      status:'Online', tasks:['Review supplier', 'Check shipping time', 'Flag backup supplier need'] },
  { id:'margin',        name:'Margin Agent',         status:'Online', tasks:['Calculate profit', 'Calculate margin', 'Flag weak margin'] },
  { id:'listing',       name:'Listing Agent',        status:'Online', tasks:['Draft listing', 'Draft SEO', 'Draft ad copy', 'Draft launch email'] },
  { id:'fulfillment',   name:'Fulfillment Agent',    status:'Online', tasks:['Track supplier order', 'Check tracking', 'Flag late delivery'] },
  { id:'support',       name:'Support Agent',        status:'Online', tasks:['Draft customer response', 'Flag refund risk', 'Suggest resolution'] },
];

const PL_SUPPORT_CASES = [
  {
    caseId:'sc1', customerName:'Jordan M.', orderId:'ORD-2841', issueType:'Late Shipment',
    productName:'Smoke House BBQ Grill Set', orderStatus:'In Transit', riskLevel:'Medium',
    customerMessage:'Hi, I ordered the BBQ grill set 12 days ago and it still hasn\'t arrived. My expected delivery was last Thursday. Can you tell me what\'s going on?',
    draftResponse:'Hi Jordan,\n\nThank you for reaching out. We sincerely apologize for the delay with your Smoke House BBQ Grill Set.\n\nYour order is currently in transit and we\'re actively monitoring the shipment. We expect it to arrive within the next 2–3 business days.\n\nIf your order does not arrive by [DATE], please reply to this message and we will open a carrier investigation immediately.\n\nWe appreciate your patience.\n\n— PD Seasoning Support',
    approvalStatus:'Pending', sendStatus:'Not Sent', createdAt:'2026-06-13',
  },
  {
    caseId:'sc2', customerName:'James R.', orderId:'ORD-2759', issueType:'Missing Item',
    productName:'Measuring Spoon Set — Gold', orderStatus:'Delivered', riskLevel:'High',
    customerMessage:'My package arrived but the measuring spoon set was not inside. The box was sealed but something is definitely missing. I need this resolved.',
    draftResponse:'Hi James,\n\nWe\'re very sorry to hear your Measuring Spoon Set was missing from your delivery. That\'s not the experience we want for you.\n\nTo help us resolve this quickly, could you confirm:\n1. Was the outer packaging intact when it arrived?\n2. Is there anything else missing from the order?\n\nOnce we have these details, we will review your replacement or refund options and follow up within 1 business day.\n\nThank you for letting us know.\n\n— PD Seasoning Support',
    approvalStatus:'Needs Review', sendStatus:'Not Sent', createdAt:'2026-06-14',
  },
  {
    caseId:'sc3', customerName:'Tanya P.', orderId:'ORD-2803', issueType:'Wrong Item',
    productName:'Charcuterie Serving Board', orderStatus:'Delivered', riskLevel:'Medium',
    customerMessage:'I ordered the charcuterie board but received a completely different product — some kind of kitchen towel set. This is really frustrating.',
    draftResponse:'Hi Tanya,\n\nWe sincerely apologize — it appears the wrong item was included with your order. We own that completely and want to make it right.\n\nTo get this corrected as quickly as possible, could you send a photo of what you received? This helps us confirm the issue and process your Charcuterie Serving Board replacement right away.\n\nYou do not need to return the incorrect item.\n\nAgain, we\'re truly sorry for the mix-up.\n\n— PD Seasoning Support',
    approvalStatus:'Pending', sendStatus:'Not Sent', createdAt:'2026-06-14',
  },
  {
    caseId:'sc4', customerName:'Marcus T.', orderId:'ORD-2791', issueType:'Refund Request',
    productName:'Seafood Night Gift Box', orderStatus:'Delivered', riskLevel:'Low',
    customerMessage:'I\'d like to return the seafood gift box. I ordered it as a gift but the recipient already had one. It hasn\'t been opened.',
    draftResponse:'Hi Marcus,\n\nThank you for reaching out. We understand how that can happen with gifts.\n\nOur return policy allows unopened items to be returned within 14 days of delivery. Since your item is unopened, we\'d be happy to review your request.\n\nNext steps:\n1. Reply to confirm you\'d like to proceed with the return\n2. We will send a prepaid return label within 1–2 business days\n3. Once we receive the item, your refund will be processed\n\nPlease note: refund processing times may vary by payment method.\n\nLet us know if you have any questions.\n\n— PD Seasoning Support',
    approvalStatus:'Approved', sendStatus:'Not Sent', createdAt:'2026-06-12',
  },
  {
    caseId:'sc5', customerName:'Priya S.', orderId:'ORD-2815', issueType:'Tracking Request',
    productName:'Smoke House BBQ Grill Set', orderStatus:'Supplier Order Needed', riskLevel:'Medium',
    customerMessage:'Can I get a tracking number for my order? I placed it 5 days ago and haven\'t received any shipping confirmation yet.',
    draftResponse:'Hi Priya,\n\nThank you for your patience. Your order is currently being prepared and will ship within the next 1–2 business days.\n\nYou will receive a shipping confirmation email with your tracking number as soon as it\'s on its way.\n\nIf you do not receive a tracking update within 48 hours, please reply here and we will look into it right away.\n\nWe appreciate your patience and look forward to getting your order to you soon.\n\n— PD Seasoning Support',
    approvalStatus:'Pending', sendStatus:'Not Sent', createdAt:'2026-06-15',
  },
];

// Live orders loaded from Order Monitor — null until tab is opened
var PL_LIVE_ORDERS = null;

// ============================================================
// HELPERS
// ============================================================
function plCalcProfit(p) {
  return p.retailPrice - p.productCost - p.shippingCost - p.paymentFee - p.packagingCost - p.estimatedAdCost;
}
function plCalcMargin(p) {
  var profit = plCalcProfit(p);
  return (profit / p.retailPrice) * 100;
}
function plBadgeClass(status) {
  var map = {
    'Live':'pl-badge-green', 'Approved for Test':'pl-badge-cyan', 'Approved':'pl-badge-green',
    'Researching':'pl-badge-gold', 'Sample Needed':'pl-badge-gold', 'Needs Review':'pl-badge-gold',
    'Pending':'pl-badge-gold', 'Sample Ordered':'pl-badge-gold', 'Contacted':'pl-badge-cyan',
    'New':'pl-badge-muted', 'Paused':'pl-badge-muted', 'Retired':'pl-badge-muted', 'Backup':'pl-badge-muted', 'Unverified':'pl-badge-muted',
    'Rejected':'pl-badge-red',
  };
  return map[status] || 'pl-badge-muted';
}
function plRiskColor(score) {
  return score <= 3 ? 'green' : score <= 6 ? 'gold' : 'red';
}
function plFmt(n) { return '$' + (parseFloat(n) || 0).toFixed(2); }
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ============================================================
// OVERLAY — open / close
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  var btn     = document.getElementById('product-lab-btn');
  var overlay = document.getElementById('product-lab-overlay');
  var close   = document.getElementById('product-lab-close');
  var content = document.getElementById('pl-content');

  if (!btn || !overlay || !close || !content) {
    console.error('Product Lab: missing required elements', { btn: btn, overlay: overlay, close: close, content: content });
    return;
  }

  btn.addEventListener('click', function() {
    overlay.classList.remove('hidden');
    setActiveTab('radar');
    renderPLTab('radar');
  });

  close.addEventListener('click', function() {
    overlay.classList.add('hidden');
  });

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) overlay.classList.add('hidden');
  });

  document.querySelectorAll('.pl-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      setActiveTab(tab.dataset.tab);
      renderPLTab(tab.dataset.tab);
    });
  });

  function setActiveTab(name) {
    document.querySelectorAll('.pl-tab').forEach(function(t) { t.classList.remove('active'); });
    var target = document.querySelector('.pl-tab[data-tab="' + name + '"]');
    if (target) target.classList.add('active');
  }

  function renderPLTab(tab) {
    switch (tab) {
      case 'radar':     renderRadar(content);         break;
      case 'validator': renderValidator(content);      break;
      case 'suppliers': renderSuppliers(content);      break;
      case 'margin':    renderMarginCalc(content);     break;
      case 'listing':   renderListingBuilder(content); break;
      case 'orders':    renderOrderMonitor(content);   break;
      case 'approvals': renderApprovalQueue(content);  break;
      case 'support':   renderSupportTab(content);     break;
      default:          renderRadar(content);
    }
  }
});

// ============================================================
// TAB 1 — PRODUCT RADAR
// ============================================================
var plActiveFilter = 'All';

function renderRadar(el) {
  var filters = ['All','New','Researching','Sample Needed','Approved for Test','Rejected','Live','Paused','Retired'];
  var filtered = plActiveFilter === 'All'
    ? PL_PRODUCTS
    : PL_PRODUCTS.filter(function(p) { return p.status === plActiveFilter; });

  el.innerHTML =
    '<h3 class="pl-section-title">Product Radar</h3>' +
    '<div class="pl-filter-row" id="pl-filter-row">' +
      filters.map(function(f) {
        return '<button class="pl-filter-btn' + (f === plActiveFilter ? ' active' : '') + '" data-filter="' + f + '">' + f + '</button>';
      }).join('') +
    '</div>' +
    '<div id="pl-product-list">' +
      (filtered.length
        ? filtered.map(renderProductCard).join('')
        : '<div style="color:#526a7a;font-size:12px;padding:20px 0;">No products in this status.</div>') +
    '</div>';

  document.getElementById('pl-filter-row').addEventListener('click', function(e) {
    var btn = e.target.closest('.pl-filter-btn');
    if (!btn) return;
    plActiveFilter = btn.dataset.filter;
    renderRadar(el);
  });

  document.getElementById('pl-product-list').addEventListener('click', function(e) {
    var btn = e.target.closest('.pl-action-btn[data-action]');
    if (!btn) return;
    var pid = btn.dataset.pid;
    var action = btn.dataset.action;
    var product = PL_PRODUCTS.find(function(p) { return p.id === pid; });
    if (!product) return;
    if (action === 'approve') product.status = 'Approved for Test';
    if (action === 'reject')  product.status = 'Rejected';
    if (action === 'live')    product.status = 'Live';
    if (action === 'sample')  product.sampleStatus = 'Requested';
    renderRadar(el);
  });
}

function renderProductCard(p) {
  var profit = plCalcProfit(p);
  var margin = plCalcMargin(p);
  var mColor = margin >= 45 ? 'green' : margin >= 30 ? 'gold' : 'red';
  var fitPct  = (p.brandFitScore / 10 * 100).toFixed(0);
  var riskPct = (p.riskScore / 10 * 100).toFixed(0);
  var riskCol = plRiskColor(p.riskScore);

  return '<div class="pl-product-card">' +
    '<div class="pl-card-top">' +
      '<div>' +
        '<div class="pl-card-name">' + p.name + '</div>' +
        '<div class="pl-card-supplier">' + p.supplierName + ' &nbsp;•&nbsp; ' + p.category + '</div>' +
      '</div>' +
      '<span class="pl-badge ' + plBadgeClass(p.status) + '">' + p.status + '</span>' +
    '</div>' +
    '<div class="pl-card-stats">' +
      '<div class="pl-stat"><div class="pl-stat-label">Cost</div><div class="pl-stat-value">'    + plFmt(p.productCost)  + '</div></div>' +
      '<div class="pl-stat"><div class="pl-stat-label">Retail</div><div class="pl-stat-value cyan">' + plFmt(p.retailPrice) + '</div></div>' +
      '<div class="pl-stat"><div class="pl-stat-label">Est. Profit</div><div class="pl-stat-value ' + (profit >= 0 ? 'green' : 'red') + '">' + plFmt(profit) + '</div></div>' +
      '<div class="pl-stat">' +
        '<div class="pl-stat-label">Margin</div>' +
        '<div style="display:flex;align-items:center;gap:6px">' +
          '<span class="pl-stat-value ' + mColor + '">' + margin.toFixed(1) + '%</span>' +
          (margin < 30 ? '<span class="pl-low-margin-badge">LOW MARGIN</span>' : '') +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="pl-score-row">' +
      '<div class="pl-score-item">Brand Fit <div class="pl-score-bar-bg"><div class="pl-score-bar-fill cyan" style="width:' + fitPct + '%"></div></div><span style="color:#00d4ff">' + p.brandFitScore + '/10</span></div>' +
      '<div class="pl-score-item">Risk <div class="pl-score-bar-bg"><div class="pl-score-bar-fill ' + riskCol + '" style="width:' + riskPct + '%"></div></div><span style="color:' + (riskCol === 'green' ? '#00e676' : riskCol === 'gold' ? '#c8a84b' : '#ff5e5e') + '">' + p.riskScore + '/10</span></div>' +
    '</div>' +
    '<div class="pl-card-actions">' +
      '<button type="button" class="pl-action-btn cyan-btn"  data-action="validate" data-pid="' + p.id + '">Validate</button>' +
      '<button type="button" class="pl-action-btn gold-btn"  data-action="sample"   data-pid="' + p.id + '">Request Sample</button>' +
      '<button type="button" class="pl-action-btn green-btn" data-action="approve"  data-pid="' + p.id + '">Approve Test</button>' +
      '<button type="button" class="pl-action-btn red-btn"   data-action="reject"   data-pid="' + p.id + '">Reject</button>' +
    '</div>' +
  '</div>';
}

// ============================================================
// TAB 2 — PRODUCT VALIDATOR
// ============================================================
function renderValidator(el) {
  el.innerHTML =
    '<h3 class="pl-section-title">Product Validator</h3>' +
    '<select class="pl-select" id="pl-validator-select">' +
      PL_PRODUCTS.map(function(p) { return '<option value="' + p.id + '">' + p.name + '</option>'; }).join('') +
    '</select>' +
    '<div id="pl-checklist"></div>';

  runValidation(PL_PRODUCTS[0].id);
  document.getElementById('pl-validator-select').addEventListener('change', function(e) {
    runValidation(e.target.value);
  });
}

function runValidation(pid) {
  var p = PL_PRODUCTS.find(function(x) { return x.id === pid; });
  if (!p) return;
  var sup = PL_SUPPLIERS.find(function(s) { return s.name === p.supplierName; });
  var margin = plCalcMargin(p);

  function status(val) {
    var cls = val === 'PASS' ? 'pl-status-pass' : val === 'WARN' ? 'pl-status-warn' : 'pl-status-fail';
    return '<span class="' + cls + '">' + val + '</span>';
  }
  function row(label, val) {
    return '<div class="pl-check-row"><span>' + label + '</span>' + status(val) + '</div>';
  }

  var brandFit    = p.brandFitScore >= 7 ? 'PASS' : p.brandFitScore >= 5 ? 'WARN' : 'FAIL';
  var relevance   = ['Kitchen Accessories','Kitchen Tools','Grilling Tools','Gift Packaging','Merch'].indexOf(p.category) > -1 ? 'PASS' : 'WARN';
  var supRel      = !sup ? 'FAIL' : sup.status === 'Approved' ? 'PASS' : sup.status === 'Rejected' ? 'FAIL' : 'WARN';
  var shipDays    = sup ? parseInt(sup.shippingTime) : 99;
  var shipping    = shipDays <= 7 ? 'PASS' : shipDays <= 10 ? 'WARN' : 'FAIL';
  var marginChk   = margin >= 30 ? 'PASS' : margin >= 20 ? 'WARN' : 'FAIL';
  var returnRisk  = !sup ? 'WARN' : sup.returnPolicy === 'No returns' ? 'FAIL' : 'PASS';
  var safetyRisk  = p.riskScore <= 3 ? 'PASS' : p.riskScore <= 6 ? 'WARN' : 'FAIL';
  var bundlePot   = p.brandFitScore >= 8 ? 'PASS' : p.brandFitScore >= 6 ? 'WARN' : 'FAIL';
  var supportRisk = p.riskScore <= 3 ? 'PASS' : p.riskScore <= 5 ? 'WARN' : 'FAIL';

  var checks = [brandFit, relevance, supRel, shipping, marginChk, returnRisk, safetyRisk, bundlePot, supportRisk];
  var fails = checks.filter(function(c) { return c === 'FAIL'; }).length;

  var rec, recColor, recBg;
  if (fails >= 2) {
    rec = 'REJECT'; recColor = '#ff5e5e'; recBg = 'rgba(255,94,94,0.07)';
  } else if (supRel === 'FAIL') {
    rec = 'NEEDS BETTER SUPPLIER'; recColor = '#c8a84b'; recBg = 'rgba(200,168,75,0.07)';
  } else if (p.sampleStatus === 'Not Ordered') {
    rec = 'NEEDS SAMPLE'; recColor = '#c8a84b'; recBg = 'rgba(200,168,75,0.07)';
  } else {
    rec = 'APPROVE'; recColor = '#00e676'; recBg = 'rgba(0,230,118,0.07)';
  }

  document.getElementById('pl-checklist').innerHTML =
    row('Brand fit with PD Seasoning', brandFit) +
    row('Cooking / gifting / grilling relevance', relevance) +
    row('Supplier reliability', supRel) +
    row('Shipping speed (≤7 business days)', shipping) +
    row('Margin strength (≥30%)', marginChk) +
    row('Return risk — policy exists', returnRisk) +
    row('Safety risk (low)', safetyRisk) +
    row('Bundle potential', bundlePot) +
    row('Customer support risk (low)', supportRisk) +
    '<div style="margin-top:20px;padding:18px 22px;border-radius:4px;text-align:center;border:1px solid ' + recColor + ';background:' + recBg + '">' +
      '<div style="font-family:Orbitron,sans-serif;font-size:9px;letter-spacing:2px;color:#526a7a;margin-bottom:8px">RECOMMENDATION</div>' +
      '<div style="font-family:Orbitron,sans-serif;font-size:16px;font-weight:700;letter-spacing:3px;color:' + recColor + '">' + rec + '</div>' +
    '</div>';
}

// ============================================================
// TAB 3 — SUPPLIER TRACKER
// ============================================================
function renderSuppliers(el) {
  el.innerHTML = '<h3 class="pl-section-title">Supplier Tracker</h3>' +
    PL_SUPPLIERS.map(function(s) {
      return '<div class="pl-supplier-card">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">' +
          '<div><div class="pl-supplier-name">' + s.name + '</div><div class="pl-supplier-meta">' + s.platform + ' &nbsp;•&nbsp; ' + s.contact + '</div></div>' +
          '<span class="pl-badge ' + plBadgeClass(s.status) + '">' + s.status + '</span>' +
        '</div>' +
        '<div style="display:flex;gap:18px;flex-wrap:wrap;margin-bottom:10px;font-size:11px;color:#8ca7ba">' +
          '<span>&#9200; ' + s.shippingTime + '</span>' +
          '<span>&#8617; ' + s.returnPolicy + '</span>' +
          (s.backupSupplier ? '<span style="color:#526a7a">Backup: ' + s.backupSupplier + '</span>' : '') +
        '</div>' +
        '<div class="pl-supplier-checks">' +
          '<span><span class="pl-check-dot ' + (s.sampleOrdered ? 'yes' : 'no') + '"></span>Sample Ordered</span>' +
          '<span><span class="pl-check-dot ' + (s.sampleReceived ? 'yes' : 'no') + '"></span>Sample Received</span>' +
          '<span><span class="pl-check-dot ' + (s.qualityApproved ? 'yes' : 'no') + '"></span>Quality Approved</span>' +
        '</div>' +
        (s.notes ? '<div style="font-size:10px;color:#526a7a;margin-top:6px;padding-top:6px;border-top:1px solid rgba(0,212,255,0.08)">' + s.notes + '</div>' : '') +
      '</div>';
    }).join('');
}

// ============================================================
// TAB 4 — MARGIN CALCULATOR
// ============================================================
function renderMarginCalc(el) {
  var s = PL_PRODUCTS[0];
  el.innerHTML =
    '<h3 class="pl-section-title">Margin Calculator</h3>' +
    '<div class="pl-calc-grid">' +
      plCalcField('pl-retail', 'Retail Price',   s.retailPrice) +
      plCalcField('pl-cost',   'Product Cost',   s.productCost) +
      plCalcField('pl-ship',   'Shipping Cost',  s.shippingCost) +
      plCalcField('pl-fee',    'Payment Fee',    s.paymentFee) +
      plCalcField('pl-pkg',    'Packaging Cost', s.packagingCost) +
      plCalcField('pl-ad',     'Est. Ad Cost',   s.estimatedAdCost) +
    '</div>' +
    '<div class="pl-calc-result strong" id="pl-calc-result">' +
      '<div class="pl-calc-result-row"><span class="pl-calc-result-label">EST. PROFIT</span><span class="pl-calc-result-value" id="pl-profit-val" style="color:#00e676"></span></div>' +
      '<div class="pl-calc-result-row"><span class="pl-calc-result-label">MARGIN</span><span class="pl-calc-result-value" id="pl-margin-val" style="color:#00e676"></span></div>' +
      '<div class="pl-calc-verdict" id="pl-calc-verdict"></div>' +
    '</div>';

  updateCalc();
  ['pl-retail','pl-cost','pl-ship','pl-fee','pl-pkg','pl-ad'].forEach(function(id) {
    document.getElementById(id).addEventListener('input', updateCalc);
  });
}

function plCalcField(id, label, val) {
  return '<div class="pl-calc-field"><div class="pl-calc-label">' + label + '</div><input class="pl-calc-input" id="' + id + '" type="number" step="0.01" min="0" value="' + val + '"/></div>';
}

function updateCalc() {
  var retail = parseFloat(document.getElementById('pl-retail').value) || 0;
  var cost   = parseFloat(document.getElementById('pl-cost').value)   || 0;
  var ship   = parseFloat(document.getElementById('pl-ship').value)   || 0;
  var fee    = parseFloat(document.getElementById('pl-fee').value)    || 0;
  var pkg    = parseFloat(document.getElementById('pl-pkg').value)    || 0;
  var ad     = parseFloat(document.getElementById('pl-ad').value)     || 0;
  var profit = retail - cost - ship - fee - pkg - ad;
  var margin = retail > 0 ? (profit / retail) * 100 : 0;

  document.getElementById('pl-profit-val').textContent = plFmt(profit);
  document.getElementById('pl-margin-val').textContent  = margin.toFixed(1) + '%';

  var resultEl  = document.getElementById('pl-calc-result');
  var profitEl  = document.getElementById('pl-profit-val');
  var marginEl  = document.getElementById('pl-margin-val');
  var verdictEl = document.getElementById('pl-calc-verdict');

  resultEl.className = 'pl-calc-result';
  if (margin >= 45) {
    resultEl.classList.add('strong');
    profitEl.style.color = '#00e676'; marginEl.style.color = '#00e676'; verdictEl.style.color = '#00e676';
    verdictEl.textContent = 'STRONG MARGIN — APPROVE';
  } else if (margin >= 30) {
    resultEl.classList.add('caution');
    profitEl.style.color = '#c8a84b'; marginEl.style.color = '#c8a84b'; verdictEl.style.color = '#c8a84b';
    verdictEl.textContent = 'TEST CAREFULLY';
  } else {
    resultEl.classList.add('reject');
    profitEl.style.color = '#ff5e5e'; marginEl.style.color = '#ff5e5e'; verdictEl.style.color = '#ff5e5e';
    verdictEl.textContent = 'REJECT — MARGIN TOO LOW';
  }
}

// ============================================================
// TAB 5 — LISTING BUILDER
// ============================================================
function renderListingBuilder(el) {
  el.innerHTML =
    '<h3 class="pl-section-title">Listing Builder</h3>' +
    '<select class="pl-select" id="pl-listing-select">' +
      PL_PRODUCTS.map(function(p) { return '<option value="' + p.id + '">' + p.name + '</option>'; }).join('') +
    '</select>' +
    '<div id="pl-listing-fields"></div>';

  fillListing(PL_PRODUCTS[0].id);
  document.getElementById('pl-listing-select').addEventListener('change', function(e) {
    fillListing(e.target.value);
  });
}

function fillListing(pid) {
  var p = PL_PRODUCTS.find(function(x) { return x.id === pid; });
  if (!p) return;
  var L = generateListing(p);
  var sup = PL_SUPPLIERS.find(function(s) { return s.name === p.supplierName; });
  var shipTime = sup ? sup.shippingTime : '5–7 days';

  document.getElementById('pl-listing-fields').innerHTML =
    lField('Product Title',       'input',    L.title) +
    lField('Short Description',   'textarea', L.desc) +
    lField('Benefit Bullets',     'textarea', L.bullets.map(function(b,i) { return (i+1)+'. '+b; }).join('\n')) +
    lField("Who It's For",        'textarea', L.whoFor) +
    lField('Bundle Ideas',        'textarea', L.bundles) +
    lField('Upsells',             'input',    L.upsells) +
    lField('FAQs',                'textarea', L.faqs.map(function(f) { return 'Q: '+f.q+'\nA: '+f.a; }).join('\n\n')) +
    lField('SEO Title',           'input',    L.seoTitle) +
    lField('SEO Description',     'textarea', L.seoDesc) +
    lField('Email Launch Copy',   'textarea', L.email) +
    lField('Ad Copy',             'textarea', L.ad) +
    lField('Image Prompt Ideas',  'textarea', L.images.join('\n\n'));
}

function lField(label, type, val) {
  var safeVal = String(val).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  if (type === 'textarea') {
    return '<div class="pl-listing-field"><div class="pl-listing-label">'+label+'</div><textarea class="pl-listing-textarea">'+safeVal+'</textarea></div>';
  }
  return '<div class="pl-listing-field"><div class="pl-listing-label">'+label+'</div><input class="pl-listing-input" type="text" value="'+safeVal.replace(/"/g,'&quot;')+'"/></div>';
}

function generateListing(p) {
  var customListings = {
    'p1': {
      title:   'Smoke House BBQ Grill Set — Premium Pitmaster Tools',
      desc:    'Take your backyard BBQ to the next level. This premium grill set is built for serious cooks who demand quality tools and bold flavor.',
      bullets: ['Heavy-duty stainless steel construction','Ergonomic non-slip handles','Compatible with gas, charcoal, and pellet grills','Pairs beautifully with PD Smoke House seasoning','Sleek matte finish — grill like a pro'],
      whoFor:  'Grill enthusiasts, BBQ lovers, gift buyers, and anyone who takes their smoke game seriously.',
      bundles: 'Bundle with Smoke House Blend for the ultimate pit kit. Add recipe cards for the full experience.',
      upsells: 'Smoke House Seasoning (4oz), ChopHouse Blend, PD Recipe Card Pack',
      faqs:    [{q:'Is this dishwasher safe?',a:'Hand washing is recommended to preserve the finish and extend tool life.'},{q:'What grill types does this work with?',a:'Compatible with gas, charcoal, pellet, and kamado grills.'}],
      seoTitle:'Premium BBQ Grill Tool Set | PD Seasoning — Pitmaster Collection',
      seoDesc: 'Shop the PD Seasoning Smoke House BBQ Grill Set. Heavy-duty stainless tools designed to complement bold smoke flavors. Free shipping on orders over $35.',
      email:   'Subject: Your BBQ just leveled up\n\nHey [First Name],\n\nWe built this grill set for one reason — because great seasoning deserves great tools.\n\nThe Smoke House BBQ Grill Set is here, and it was made to pair with your PD Smoke House blend.\n\nShop now → [link]\n\n— PD Seasoning',
      ad:      'The Smoke House BBQ Grill Set is here.\n\nPremium stainless tools + bold smoke flavor = the ultimate pit kit.\n\nBundle it with PD Smoke House Seasoning and grill like you mean it.\n\nShop Now →',
      images:  ['Matte black grill tools flat lay on dark slate with smoke wisps and gold accent lighting','Close-up of stainless tongs gripping a thick ribeye over glowing charcoal','Gift box open: grill set + Smoke House blend tin on black wood background'],
    },
  };
  if (customListings[p.id]) return customListings[p.id];

  var sup = PL_SUPPLIERS.find(function(s) { return s.name === p.supplierName; });
  var shipTime = sup ? sup.shippingTime : '5–7 days';
  return {
    title:   p.name + ' — Premium Kitchen Essential',
    desc:    'A must-have for anyone serious about flavor. The ' + p.name + ' is designed to elevate your cooking and pair perfectly with PD Seasoning blends.',
    bullets: ['Premium quality build','Food-safe materials','Perfect gift or personal upgrade','Pairs with PD Seasoning blends','Built for real cooks'],
    whoFor:  'Home cooks, food lovers, gift buyers, and PD Seasoning fans who want the full experience.',
    bundles: 'Bundle with any PD Seasoning blend for maximum impact. Consider a gift box add-on.',
    upsells: 'Any PD Seasoning Blend, Recipe Card Pack, Gift Box Upgrade',
    faqs:    [{q:'Does this ship quickly?',a:'Yes — expect delivery within ' + shipTime + '.'},{q:'Can I bundle this with seasoning?',a:'Absolutely — we recommend pairing with any of our PD Seasoning blends for the full experience.'}],
    seoTitle:p.name + ' | PD Seasoning Kitchen Collection',
    seoDesc: 'Shop ' + p.name + ' from PD Seasoning. Premium quality, brand-approved, and designed for real food lovers.',
    email:   'Subject: New drop: ' + p.name + '\n\nHey [First Name],\n\nWe\'re excited to introduce the ' + p.name + ' to the PD Seasoning family.\n\nBuilt for flavor lovers. Ships fast. Looks great.\n\nShop now → [link]\n\n— PD Seasoning',
    ad:      'New from PD Seasoning: ' + p.name + '\n\nPremium quality. Brand approved. Ships fast.\n\nGrab yours now →',
    images:  [p.name + ' on matte black surface with gold accent lighting and seasoning tin in background','Lifestyle shot: ' + p.name + ' in use in a modern kitchen','Gift presentation: ' + p.name + ' in branded PD box'],
  };
}

// ============================================================
// TAB 6 — ORDER MONITOR
// ============================================================
function loadOrderMonitorData(callback) {
  fetch('/.netlify/functions/orders-monitor-get')
    .then(function(res) { return res.json(); })
    .then(function(data) { callback(null, data); })
    .catch(function(err) { callback(err, null); });
}

function normalizeLiveOrder(row) {
  var risk = row.refund_risk || 'Low';
  return {
    id:                  row.id,
    customerName:        row.customer_name  || 'Customer',
    productName:         row.product_summary || '—',
    orderStatus:         row.order_status   || 'Issue',
    supplierOrderStatus: '—',
    trackingNumber:      row.tracking_number || '',
    expectedDelivery:    row.expected_delivery || '',
    lateFlag:            !!row.late_flag,
    refundRisk:          risk.charAt(0).toUpperCase() + risk.slice(1).toLowerCase(),
    supportNotes:        row.support_notes || ''
  };
}

function renderOrderKanban(el, orders) {
  var columns = ['Paid','Supplier Order Needed','Supplier Ordered','Tracking Received','In Transit','Delivered','Issue','Refunded'];
  var grouped = {};
  columns.forEach(function(c) { grouped[c] = []; });
  orders.forEach(function(o) {
    var col = grouped[o.orderStatus] ? o.orderStatus : 'Issue';
    grouped[col].push(o);
  });

  function riskBadge(risk) {
    var r = (risk || '').toLowerCase();
    var cls = r === 'high' ? 'pl-badge-red' : r === 'medium' ? 'pl-badge-gold' : r === 'low' ? 'pl-badge-cyan' : 'pl-badge-muted';
    return '<span class="pl-badge ' + cls + '">' + escHtml(risk) + ' Risk</span>';
  }

  el.innerHTML = '<div class="pl-kanban">' +
    columns.map(function(col) {
      var colOrders = grouped[col];
      return '<div class="pl-kanban-col">' +
        '<div class="pl-kanban-col-header">' + col + '<br><span style="color:rgba(0,212,255,0.4)">' + colOrders.length + ' order' + (colOrders.length !== 1 ? 's' : '') + '</span></div>' +
        colOrders.map(function(o) {
          return '<div class="pl-order-card">' +
            '<div class="pl-order-customer">' + escHtml(o.customerName) + '</div>' +
            '<div class="pl-order-product">' + escHtml(o.productName) + '</div>' +
            (o.trackingNumber ? '<div class="pl-order-tracking">' + escHtml(o.trackingNumber.slice(0,12)) + '&#8230;</div>' : '<div class="pl-order-tracking" style="color:rgba(82,106,122,0.5)">No tracking</div>') +
            '<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px">' +
              riskBadge(o.refundRisk) +
              (o.lateFlag ? '<span class="pl-late-badge">LATE</span>' : '') +
            '</div>' +
            (o.supportNotes ? '<div style="font-size:9px;color:#526a7a;margin-top:5px;line-height:1.4">' + escHtml(o.supportNotes) + '</div>' : '') +
          '</div>';
        }).join('') +
      '</div>';
    }).join('') +
  '</div>';
}

function renderOrderMonitor(el) {
  el.innerHTML =
    '<h3 class="pl-section-title">Order Monitor ' +
    '<span class="pl-data-source-badge pl-data-source-loading" id="pl-orders-badge">&#8635; Loading&hellip;</span>' +
    '</h3>' +
    '<div class="pl-kanban-hint">Scroll sideways to view all order stages &rarr;</div>' +
    '<div id="pl-order-kanban-wrap"></div>';

  loadOrderMonitorData(function(err, result) {
    var badge = document.getElementById('pl-orders-badge');
    var wrap  = document.getElementById('pl-order-kanban-wrap');
    if (!badge || !wrap) return;

    var orders;
    if (!err && result && result.ok && Array.isArray(result.orders)) {
      orders = result.orders.map(normalizeLiveOrder);
      PL_LIVE_ORDERS = orders;
      badge.className   = 'pl-data-source-badge pl-data-source-live';
      badge.innerHTML   = '&#9679; LIVE SUPABASE';
    } else {
      orders = PL_ORDERS;
      badge.className   = 'pl-data-source-badge pl-data-source-mock';
      badge.innerHTML   = '&#9632; MOCK FALLBACK';
    }

    renderOrderKanban(wrap, orders);
  });
}

// ============================================================
// TAB 7 — APPROVAL QUEUE
// ============================================================
function renderApprovalQueue(el) {
  el.innerHTML =
    '<h3 class="pl-section-title">Approval Queue</h3>' +
    '<div id="pl-approvals-list">' +
      PL_APPROVALS.map(function(item) { return renderApprovalCard(item); }).join('') +
    '</div>' +
    '<h3 class="pl-section-title" style="margin-top:28px">Lab Agents</h3>' +
    '<div class="pl-agent-grid">' +
      PL_AGENTS.map(function(a) {
        return '<div class="pl-agent-card">' +
          '<div class="pl-agent-name">' + a.name + '</div>' +
          '<div class="pl-agent-status"><span class="pl-agent-status-dot"></span>' + a.status + '</div>' +
          a.tasks.map(function(t) { return '<div class="pl-agent-task">' + t + '</div>'; }).join('') +
        '</div>';
      }).join('') +
    '</div>';

  document.getElementById('pl-approvals-list').addEventListener('click', function(e) {
    var btn = e.target.closest('[data-approve-action]');
    if (!btn) return;
    var aid    = btn.dataset.aid;
    var action = btn.dataset.approveAction;
    var item   = PL_APPROVALS.find(function(a) { return a.id === aid; });
    if (!item) return;
    if (action === 'approve') item.status = 'Approved';
    if (action === 'reject')  item.status = 'Rejected';
    if (action === 'review')  item.status = 'Needs Review';

    var card  = btn.closest('.pl-approval-card');
    var badge = card.querySelector('.pl-approval-status-badge');
    badge.className = 'pl-badge ' + plBadgeClass(item.status) + ' pl-approval-status-badge';
    badge.textContent = item.status;
    card.querySelectorAll('[data-approve-action]').forEach(function(b) {
      b.disabled = true;
      b.style.opacity = '0.4';
      b.style.cursor = 'not-allowed';
    });
  });
}

function renderApprovalCard(item) {
  return '<div class="pl-approval-card">' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">' +
      '<div class="pl-approval-type">' + item.type + '</div>' +
      '<span class="pl-badge ' + plBadgeClass(item.status) + ' pl-approval-status-badge">' + item.status + '</span>' +
    '</div>' +
    '<div class="pl-approval-item">' + item.item + '</div>' +
    '<div class="pl-approval-detail">' + item.detail + '</div>' +
    '<div class="pl-approval-actions pl-approval-action-row">' +
      '<button type="button" class="action-btn approve" data-aid="' + item.id + '" data-approve-action="approve">Approve</button>' +
      '<button type="button" class="action-btn reject"  data-aid="' + item.id + '" data-approve-action="reject">Reject</button>' +
      '<button type="button" class="action-btn hold"    data-aid="' + item.id + '" data-approve-action="review">Needs Review</button>' +
    '</div>' +
  '</div>';
}

// ============================================================
// SUPPORT CASE GENERATOR — from live Order Monitor data
// ============================================================
var ISSUE_KEYWORDS = ['missing','issue','refund','late','cancel','wrong','problem','damage','broken','lost'];

function generateCasesFromOrders(orders) {
  if (!orders || !orders.length) return [];
  var today = new Date().toISOString().slice(0, 10);
  var newCases = [];

  orders.forEach(function(o) {
    var issueType = null;
    var risk = (o.refundRisk || '').toLowerCase();

    if (o.orderStatus === 'Issue') {
      issueType = 'Order Issue';
    } else if (o.lateFlag) {
      issueType = 'Late Shipment';
    } else if (!o.trackingNumber) {
      issueType = 'Missing Tracking';
    } else if (risk === 'high' || risk === 'medium') {
      issueType = 'Refund Risk';
    } else {
      var notes = (o.supportNotes || '').toLowerCase();
      if (ISSUE_KEYWORDS.some(function(kw) { return notes.indexOf(kw) !== -1; })) {
        issueType = 'Support Note Flagged';
      }
    }

    if (!issueType) return;

    var orderId = String(o.id);
    var alreadyExists = PL_SUPPORT_CASES.some(function(c) {
      return c.orderId === orderId && c.issueType === issueType;
    });
    if (alreadyExists) return;

    var riskLabel = risk === 'high' ? 'High' : risk === 'medium' ? 'Medium' : 'Low';
    var caseId    = 'gen-' + orderId + '-' + issueType.replace(/\s+/g, '-').toLowerCase();

    newCases.push({
      caseId:          caseId,
      customerName:    o.customerName || 'Customer',
      orderId:         orderId,
      issueType:       issueType,
      productName:     o.productName  || '—',
      orderStatus:     o.orderStatus  || '—',
      riskLevel:       riskLabel,
      customerMessage: generateCustomerMessage(issueType, o),
      draftResponse:   generateDraftResponse(issueType, o),
      approvalStatus:  'Pending',
      sendStatus:      'Not Sent',
      source:          'Live Order Generated',
      createdAt:       today,
    });
  });

  return newCases;
}

function generateCustomerMessage(issueType, o) {
  var product = o.productName || 'my order';
  switch (issueType) {
    case 'Missing Tracking':
      return 'Hi, I placed an order for ' + product + ' and have not received a tracking number or shipping confirmation yet. Can you let me know the status of my shipment?';
    case 'Late Shipment':
      return 'Hi, my order for ' + product + ' has not arrived yet and appears to be past the expected delivery date. Can you check on the status for me?';
    case 'Order Issue':
      return 'Hi, there seems to be an issue flagged on my order for ' + product + '. Can someone from your team look into this and let me know what is happening?';
    case 'Refund Risk':
      return 'Hi, I have a concern about my recent order for ' + product + ' and would like to understand my options. Please let me know how we can resolve this.';
    case 'Support Note Flagged':
      return 'Hi, I have a question about my order for ' + product + '. Can your support team follow up with me?';
    default:
      return 'Hi, I have a question about my order for ' + product + '.';
  }
}

function generateDraftResponse(issueType, o) {
  var firstName = (o.customerName || 'there').split(' ')[0];
  switch (issueType) {
    case 'Missing Tracking':
      return 'Hi ' + firstName + ',\n\nThank you for reaching out. We have reviewed your order and are currently confirming the shipment details with our fulfillment team.\n\nA tracking number will be added to your order as soon as it is confirmed with the carrier. We will follow up with an update within 1 business day.\n\nWe appreciate your patience.\n\n— PD Seasoning Support';
    case 'Late Shipment':
      return 'Hi ' + firstName + ',\n\nWe sincerely apologize that your order has not arrived yet. We understand how frustrating that is and we want to help.\n\nOur team is actively checking the fulfillment status of your shipment. We are not able to guarantee a specific delivery date at this time, but we are treating your order as a priority.\n\nWe will provide a status update within 1 business day.\n\nThank you for your patience.\n\n— PD Seasoning Support';
    case 'Order Issue':
      return 'Hi ' + firstName + ',\n\nThank you for contacting us. Your order has been flagged for review by our support team.\n\nWe are looking into the details and will confirm the next step within 1 business day. No action is needed from you at this time.\n\nWe appreciate your patience.\n\n— PD Seasoning Support';
    case 'Refund Risk':
      return 'Hi ' + firstName + ',\n\nThank you for reaching out. We want to make sure your concern is handled correctly.\n\nYour order is currently under review. We will follow up with a resolution within 1–2 business days. No action is needed from you at this time.\n\nPlease do not return any items until you hear from us.\n\n— PD Seasoning Support';
    case 'Support Note Flagged':
      return 'Hi ' + firstName + ',\n\nThank you for reaching out. We have noted a concern with your order and our team is reviewing the details.\n\nWe will follow up with an update within 1 business day.\n\nWe appreciate your patience.\n\n— PD Seasoning Support';
    default:
      return 'Hi ' + firstName + ',\n\nThank you for contacting PD Seasoning support. We have received your message and will follow up within 1 business day.\n\n— PD Seasoning Support';
  }
}

// ============================================================
// TAB 8 — CUSTOMER SERVICE (SUPPORT)
// ============================================================
function renderSupportTab(el) {
  var generatedCount = PL_SUPPORT_CASES.filter(function(c) { return c.source === 'Live Order Generated'; }).length;

  el.innerHTML =
    '<h3 class="pl-section-title">Customer Service</h3>' +
    '<div class="pl-support-note">All responses require approval before sending. No real emails are sent from this module.</div>' +
    '<div class="pl-generate-row">' +
      '<button type="button" class="pl-action-btn cyan-btn" id="pl-generate-cases-btn">&#9654; Generate Cases From Orders</button>' +
      '<span class="pl-generated-badge" id="pl-generated-badge"' + (generatedCount ? '' : ' style="display:none"') + '>Generated from Live Orders: ' + generatedCount + '</span>' +
    '</div>' +
    '<div id="pl-generate-status"></div>' +
    '<div id="pl-support-cases">' +
    PL_SUPPORT_CASES.map(renderSupportCard).join('') +
    '</div>';

  document.getElementById('pl-generate-cases-btn').addEventListener('click', function() {
    var statusEl = document.getElementById('pl-generate-status');
    var casesEl  = document.getElementById('pl-support-cases');
    var badgeEl  = document.getElementById('pl-generated-badge');

    if (!PL_LIVE_ORDERS || !PL_LIVE_ORDERS.length) {
      statusEl.innerHTML = '<div class="pl-generate-status-msg pl-generate-no-data">No live order data available. Open the Order Monitor tab first to load live orders.</div>';
      return;
    }

    var newCases = generateCasesFromOrders(PL_LIVE_ORDERS);

    if (!newCases.length) {
      statusEl.innerHTML = '<div class="pl-generate-status-msg pl-generate-no-flags">No flagged orders found. All current live orders look healthy.</div>';
      return;
    }

    newCases.forEach(function(c) {
      PL_SUPPORT_CASES.push(c);
      casesEl.insertAdjacentHTML('beforeend', renderSupportCard(c));
    });

    var total = PL_SUPPORT_CASES.filter(function(c) { return c.source === 'Live Order Generated'; }).length;
    if (badgeEl) {
      badgeEl.textContent = 'Generated from Live Orders: ' + total;
      badgeEl.style.display = '';
    }
    statusEl.innerHTML = '<div class="pl-generate-status-msg pl-generate-success">&#10003; ' + newCases.length + ' case' + (newCases.length !== 1 ? 's' : '') + ' generated from live orders.</div>';
  });

  document.getElementById('pl-support-cases').addEventListener('click', function(e) {
    var btn = e.target.closest('[data-support-action]');
    if (!btn) return;
    var caseId = btn.dataset.caseId;
    var action  = btn.dataset.supportAction;
    var c = PL_SUPPORT_CASES.find(function(x) { return x.caseId === caseId; });
    if (!c) return;

    var cardEl = document.getElementById('pl-support-card-' + caseId);
    if (cardEl) {
      var ta = cardEl.querySelector('.pl-support-textarea');
      if (ta) c.draftResponse = ta.value;
    }

    if (action === 'approve') c.approvalStatus = 'Approved';
    if (action === 'review')  c.approvalStatus = 'Needs Review';
    if (action === 'reject')  c.approvalStatus = 'Rejected';
    if (action === 'send' && c.approvalStatus === 'Approved' && c.sendStatus !== 'Sent (Mock)') {
      c.sendStatus = 'Sent (Mock)';
    }

    if (cardEl) {
      cardEl.insertAdjacentHTML('beforebegin', renderSupportCard(c));
      cardEl.remove();
    }
  });
}

function renderSupportCard(c) {
  var riskBadge  = c.riskLevel === 'High' ? 'pl-badge-red' : c.riskLevel === 'Medium' ? 'pl-badge-gold' : 'pl-badge-green';
  var sendBadge  = c.sendStatus === 'Sent (Mock)' ? 'pl-badge-green' : 'pl-badge-muted';
  var approved   = c.approvalStatus === 'Approved';
  var sent       = c.sendStatus === 'Sent (Mock)';
  var sourceMark = c.source === 'Live Order Generated'
    ? ' <span class="pl-source-badge">&#9679; Live Order</span>'
    : '';

  return '<div class="pl-support-card" id="pl-support-card-' + c.caseId + '">' +
    '<div class="pl-support-header">' +
      '<div>' +
        '<div class="pl-support-customer">' + escHtml(c.customerName) + '</div>' +
        '<div class="pl-support-meta">' + escHtml(c.orderId) + ' &nbsp;&middot;&nbsp; ' + escHtml(c.productName) + ' &nbsp;&middot;&nbsp; ' + escHtml(c.createdAt) + sourceMark + '</div>' +
      '</div>' +
      '<div class="pl-support-badges">' +
        '<span class="pl-badge pl-badge-cyan">' + escHtml(c.issueType) + '</span>' +
        '<span class="pl-badge ' + riskBadge + '">' + escHtml(c.riskLevel) + ' Risk</span>' +
      '</div>' +
    '</div>' +
    '<div class="pl-support-label">CUSTOMER MESSAGE</div>' +
    '<div class="pl-support-message">' + escHtml(c.customerMessage) + '</div>' +
    '<div class="pl-support-label pl-draft-label">DRAFT RESPONSE</div>' +
    '<textarea class="pl-listing-textarea pl-support-textarea">' + escHtml(c.draftResponse) + '</textarea>' +
    '<div class="pl-support-status-row">' +
      '<span class="pl-support-status-label">APPROVAL</span>' +
      '<span class="pl-badge ' + plBadgeClass(c.approvalStatus) + '">' + escHtml(c.approvalStatus) + '</span>' +
      '<span class="pl-support-status-label">SEND</span>' +
      '<span class="pl-badge ' + sendBadge + '">' + escHtml(c.sendStatus) + '</span>' +
    '</div>' +
    '<div class="pl-support-actions">' +
      '<button type="button" class="pl-action-btn green-btn" data-support-action="approve" data-case-id="' + c.caseId + '">Approve Response</button>' +
      '<button type="button" class="pl-action-btn gold-btn"  data-support-action="review"  data-case-id="' + c.caseId + '">Needs Review</button>' +
      '<button type="button" class="pl-action-btn red-btn"   data-support-action="reject"  data-case-id="' + c.caseId + '">Reject Response</button>' +
      (sent
        ? '<button type="button" class="pl-action-btn pl-sent-btn" disabled>&#10003; Sent (Mock)</button>'
        : '<button type="button" class="pl-action-btn ' + (approved ? 'cyan-btn' : 'pl-locked-btn') + '" data-support-action="send" data-case-id="' + c.caseId + '">Mark Sent Mock</button>') +
    '</div>' +
    (!approved && !sent ? '<div class="pl-send-warning">Approval required before sending.</div>' : '') +
  '</div>';
}
