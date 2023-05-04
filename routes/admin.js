var express = require('express');
var router = express.Router();
// const adminHelper = require('../helpers/admin-helpers');
const adminController = require('../controllers/adminController');
// const cloudinary = require('../utils/cloudinary')
const upload = require('../utils/multer')
const middleware = require('../middelwares/middleware')





router.get('/',adminController.adminLogin)

router.get('/home', middleware.checkAdminLoggedIn, adminController.adminHome)

router.post('/login',adminController.adminLoginPost )

router.get('/view-categories',middleware.checkAdminLoggedIn,adminController.adminViewAllCategories)
router.get('/add-category',middleware.checkAdminLoggedIn,adminController.adminAddCategory)

router.post('/add-category',middleware.checkAdminLoggedIn,adminController.adminAddCategoryPost)
router.get('/edit-category/:id',middleware.checkAdminLoggedIn,adminController.adminEditCategory)
router.post('/edit-category/:id',middleware.checkAdminLoggedIn,adminController.adminEditCategoryPost)



 
router.get('/product-details',middleware.checkAdminLoggedIn,adminController.adminViewProductDetails)

router.get('/add-product',middleware.checkAdminLoggedIn,adminController.adminAddProduct)

router.post('/add-product', upload.array('image'),adminController.adminAddProductPost )


router.get('/edit-product/:id', middleware.checkAdminLoggedIn,adminController.adminEditProduct)

router.post('/edit-product/:id', upload.array('image'),adminController.adminEditProductPost)

router.get('/delete-product/:id', adminController.adminDeleteProduct)

router.get('/user-details',middleware.checkAdminLoggedIn, adminController.adminViewUserDetails)

router.get('/block/:id', adminController.adminBlockUser)

router.get('/unblock/:id',adminController.adminUnblockUser )

router.get('/list/:id', adminController.listCategory)

router.get('/unlist/:id',adminController.unListCategory )

router.get('/view-banners',adminController.viewBanners )

router.get('/add-banners',adminController.addBanners )

router.post('/add-banners',upload.array('image'),adminController.addBannersPost )

router.get('/delete-banner/:id',adminController.deleteBanner )


router.get('/coupones-management',adminController.viewCoupones )
router.get('/add-coupones',adminController.addCoupones )
router.post('/add-coupones',adminController.addCouponesPost )


router.get('/delete-coupons/:id',adminController.deleteCoupons )

router.get('/order-management',adminController.orgerManagement )
router.get('/single-order/:id',adminController.singleOrder )
router.post('/change-order-status/',adminController.changeStatus )
router.get('/sales-report/',adminController.salesReport )
router.get('/graph-statics',adminController.graphStatics )
router.get('/graph-statics-date',adminController.graphStaticsDate )











router.get('/logout',adminController.adminLogOut)





module.exports = router;
