const sidebarLinks = {
  Dashboard: "/admin/dashboard", Orders: "/admin/orders", Products: "/admin/products",
  "Sales Report": "/admin/sales-report", Customers: "/admin/users/allUsers", Coupons: "/admin/coupons",
  Categories: "/admin/category", "Refund / Return": "/admin/returns", Banners: "/admin/banners",
  Referrals: "/admin/referrals", Offers: "/admin/offers", "Sign Out": "/admin/logout",
};
document.querySelectorAll(".sidebar .nav-link").forEach((link) => {
  const label = link.textContent.replace(/\s+/g, " ").trim();
  if (sidebarLinks[label]) link.href = sidebarLinks[label];
});
