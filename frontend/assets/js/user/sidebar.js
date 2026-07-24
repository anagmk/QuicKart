document.addEventListener("DOMContentLoaded", () => {
  const sidebarItems = document.querySelectorAll(".menu .list-group-item");

  sidebarItems.forEach((item) => {
    item.addEventListener("click", () => {
      sidebarItems.forEach((sidebarItem) => {
        sidebarItem.classList.remove("sidebar-active");
      });
      item.classList.add("sidebar-active");
    });
  });
});
