var express = require("express");
var router = express.Router();
// const adminHelper = require('../helpers/admin-helpers');
const adminController = require("../controllers/adminController");
// const cloudinary = require('../utils/cloudinary')
const upload = require("../utils/multer");
const middleware = require("../middelwares/middleware");

router.get("/", adminController.adminLogin);

router.get("/home", middleware.checkAdminLoggedIn, adminController.adminHome);

router.post("/login", adminController.adminLoginPost);

router.get(
  "/view-categories",
  middleware.checkAdminLoggedIn,
  adminController.adminViewAllCategories
);
router.get(
  "/add-category",
  middleware.checkAdminLoggedIn,
  adminController.adminAddCategory
);

router.post(
  "/add-category",
  middleware.checkAdminLoggedIn,
  adminController.adminAddCategoryPost
);
router.get(
  "/edit-category/:id",
  middleware.checkAdminLoggedIn,
  adminController.adminEditCategory
);
router.post(
  "/edit-category/:id",
  middleware.checkAdminLoggedIn,
  adminController.adminEditCategoryPost
);

router.get(
  "/product-details",
  middleware.checkAdminLoggedIn,
  adminController.adminViewProductDetails
);

router.get(
  "/add-product",
  middleware.checkAdminLoggedIn,
  middleware.checkAdminLoggedIn,
  adminController.adminAddProduct
);

router.post(
  "/add-product",
  middleware.checkAdminLoggedIn,
  upload.array("image"),
  adminController.adminAddProductPost
);

router.get(
  "/edit-product/:id",
  middleware.checkAdminLoggedIn,
  adminController.adminEditProduct
);

router.post(
  "/edit-product/:id",
  middleware.checkAdminLoggedIn,
  upload.array("image"), 
  adminController.adminEditProductPost
);

router.get("/delete-product/:id",  middleware.checkAdminLoggedIn,adminController.adminDeleteProduct);

router.get(
  "/user-details",
  middleware.checkAdminLoggedIn,
  adminController.adminViewUserDetails
);

router.get("/block/:id",  middleware.checkAdminLoggedIn,adminController.adminBlockUser);

router.get("/unblock/:id",  middleware.checkAdminLoggedIn,adminController.adminUnblockUser);

router.get("/list/:id", middleware.checkAdminLoggedIn, adminController.listCategory);

router.get("/unlist/:id", middleware.checkAdminLoggedIn, adminController.unListCategory);

router.get("/view-banners",  middleware.checkAdminLoggedIn,adminController.viewBanners);

router.get("/add-banners",  middleware.checkAdminLoggedIn,adminController.addBanners);

router.post(
  "/add-banners",
  upload.array("image"), middleware.checkAdminLoggedIn,
  adminController.addBannersPost
);

router.get("/delete-banner/:id",  middleware.checkAdminLoggedIn,adminController.deleteBanner);

router.get("/coupones-management",  middleware.checkAdminLoggedIn, adminController.viewCoupones);
router.get("/add-coupones", middleware.checkAdminLoggedIn, adminController.addCoupones);
router.post("/add-coupones",  middleware.checkAdminLoggedIn,adminController.addCouponesPost);

router.get("/delete-coupons/:id", middleware.checkAdminLoggedIn, adminController.deleteCoupons);

router.get("/order-management",  middleware.checkAdminLoggedIn,adminController.orgerManagement);
router.get("/single-order/:id",  middleware.checkAdminLoggedIn,adminController.singleOrder);
router.post("/change-order-status/",  middleware.checkAdminLoggedIn,adminController.changeStatus);
router.get("/sales-report/", middleware.checkAdminLoggedIn, adminController.salesReport);
router.get("/graph-statics",  middleware.checkAdminLoggedIn,adminController.graphStatics);
router.get("/graph-statics-date", middleware.checkAdminLoggedIn, adminController.graphStaticsDate);
router.get("/graph-statics-category",  middleware.checkAdminLoggedIn,adminController.graphStaticsCategory);

router.get("/logout", middleware.checkAdminLoggedIn, adminController.adminLogOut);

module.exports = router;
