// Quote Tools Studio: shared calculator + printable quote. No tracking, nothing leaves the browser.
(function () {
  const $ = (id) => document.getElementById(id);
  const money = (n) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fields = ["crew", "hours", "rate", "travel", "supplies", "overhead", "margin"];
  const STORE = "qts-business";

  // Pure pricing (same method as the paid Excel calculator): price = cost / (1 - margin).
  function priceJob(v) {
    const labor = v.crew * v.hours * v.rate;
    const cost = labor + v.travel + v.supplies + v.overhead;
    const m = v.margin / 100;
    const price = cost / (1 - m);
    return { labor, cost, price, profit: price - cost };
  }
  function roundUp(x, step) { return step > 0 ? Math.ceil(x / step - 1e-9) * step : x; }
  window.QTS = { priceJob, roundUp };

  function read() {
    const v = {}; const errs = [];
    for (const f of fields) {
      const el = $(f); const n = Number(el.value);
      const bad = el.value === "" || !isFinite(n) || n < 0 ||
        (f === "crew" && (n < 1 || n % 1 !== 0)) || (f === "hours" && n <= 0) || (f === "margin" && n >= 100);
      el.classList.toggle("bad", bad);
      if (bad) errs.push(el.dataset.err); v[f] = n;
    }
    return { v, errs };
  }

  function render() {
    const { v, errs } = read();
    const out = $("result");
    if (errs.length) { out.innerHTML = '<p class="err">' + errs.join("<br>") + "</p>"; $("q-price").textContent = "—"; return; }
    const r = priceJob(v);
    const quoted = roundUp(r.price, Number($("round").value));
    out.innerHTML =
      '<div class="big"><span>Quote this job at</span><strong>' + money(quoted) + "</strong></div>" +
      "<table>" +
      "<tr><td>Labor (" + v.crew + " × " + v.hours + " h × " + money(v.rate) + ")</td><td>" + money(r.labor) + "</td></tr>" +
      "<tr><td>Travel</td><td>" + money(v.travel) + "</td></tr>" +
      "<tr><td>Supplies</td><td>" + money(v.supplies) + "</td></tr>" +
      "<tr><td>Overhead share</td><td>" + money(v.overhead) + "</td></tr>" +
      '<tr class="sum"><td>Your cost</td><td>' + money(r.cost) + "</td></tr>" +
      '<tr class="sum"><td>Profit at ' + money(quoted) + "</td><td>" + money(quoted - r.cost) + " (" + (quoted ? Math.round((quoted - r.cost) / quoted * 100) : 0) + "%)</td></tr>" +
      "</table>";
    $("q-price").textContent = money(quoted);
  }

  function syncQuote() {
    const biz = $("biz").value.trim() || "Your business name";
    $("q-biz").textContent = biz;
    $("q-contact").textContent = $("contact").value.trim();
    $("q-customer").textContent = $("customer").value.trim() || "Customer name";
    $("q-job").textContent = $("jobdesc").value.trim() || $("jobdesc").placeholder;
    $("q-date").textContent = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    try { localStorage.setItem(STORE, JSON.stringify({ biz: $("biz").value, contact: $("contact").value })); } catch (e) {}
  }

  document.addEventListener("DOMContentLoaded", function () {
    try { const s = JSON.parse(localStorage.getItem(STORE) || "{}"); if (s.biz) $("biz").value = s.biz; if (s.contact) $("contact").value = s.contact; } catch (e) {}
    document.querySelectorAll("#calc input, #calc select").forEach((el) => el.addEventListener("input", render));
    document.querySelectorAll("#quote-form input").forEach((el) => el.addEventListener("input", syncQuote));
    $("print").addEventListener("click", () => { syncQuote(); window.print(); });
    render(); syncQuote();
  });
})();
