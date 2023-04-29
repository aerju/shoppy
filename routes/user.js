var express = require('express');
var router = express.Router();
// const userHelper = require('../helpers/user-helpers')
// const adminHelper = require('../helpers/admin-helpers')

const userController =require('../controllers/userController')
const middleware = require('../middelwares/middleware');
const adminController = require('../controllers/adminController');


router.get('/', userController.userHome);

router.get('/login',  middleware.sessionHandle, userController.userLogin);

router.post('/login',userController.userLoginPost )

router.get('/login-otp',  middleware.sessionHandle, userController.userLOginWithOtp);
router.post('/login-otp',  middleware.sessionHandle, userController.userLOginWithOtpPost);
router.post('/verify-otp',  middleware.sessionHandle, userController.verifyOpt);

router.post('/forgot-password',  middleware.sessionHandle, userController.forgortPasswordPOst);
router.get('/forgot-password',  middleware.sessionHandle, userController.forgortPassword);
router.post('/update-password',  middleware.sessionHandle, userController.updatePassword);











router.get('/signup',  middleware.sessionHandle, userController.userSignUp);

router.post('/signup', userController.userSignUpPost)

router.get('/logout', userController.userLogOut)
router.get('/profile', middleware.checkUserLoggedIn,userController.userViewProfile)


router.get('/view-product/:id', userController.userViewSingleProduct)
router.get('/category/:id', userController.userCategory)


router.get('/view-cart',middleware.checkUserLoggedIn, userController.viewCart)


router.get('/add-to-cart/:id',  middleware.checkUserLoggedIn, userController.addToCart)
router.post('/chnage-product-quantity',middleware.checkUserLoggedIn, userController.changePoductQuantity)
router.post('/remove-cart-product', userController.removeCartProducts)


router.get('/check-out',middleware.checkUserLoggedIn,userController.userCheckOut)
router.post('/check-out',middleware.checkUserLoggedIn,userController.userCheckOutPost)
router.get('/order-success',middleware.checkUserLoggedIn,userController.orderSuccess)
router.get('/view-orders',middleware.checkUserLoggedIn,userController.viewOrders)
router.get('/view-order-products/:id',middleware.checkUserLoggedIn,userController.viewOrderProducts)
router.post('/verify-payment',userController.verifyPaymentPost)


router.get('/wishlist',middleware.checkUserLoggedIn,userController.viewWishlist)
router.get('/add-to-wishlist/:id',  middleware.checkUserLoggedIn, userController.addtowishlist)
router.post('/remove-wishlist-product',  middleware.checkUserLoggedIn, userController.removeWishlistProducts)




router.get('/manage-address',middleware.checkUserLoggedIn,userController.manageAddress)
router.post('/add-address',middleware.checkUserLoggedIn,userController.addAddress)
router.post('/apply-coupone',middleware.checkUserLoggedIn,userController.applycoupone)
router.post('/delete-address',middleware.checkUserLoggedIn,userController.deleteAddress)
router.post('/edit-address',middleware.checkUserLoggedIn,userController.editAddress)
router.post('/update-address',middleware.checkUserLoggedIn,userController.updateAddress)




router.get('/search',userController.search)
router.post('/cancel-request',userController.cancelRequest)
router.post('/return-request',userController.returnRequest)

router.get('/wallet',middleware.checkUserLoggedIn,userController.wallet)
router.post('/update-profile/:id',middleware.checkUserLoggedIn,userController.updateProfile)










// router.get('/searched',userController.searched)










module.exports = router;




// router.get('/view-product', function (req, res, next) {
//   res.render('user/singleProductView',{userHead:false ,user,products});
// });



// router.get('/view-product', function (req, res, next) {



// signUpPage: (req, res) => {
//   if (req.session.loggedIn) {
//     res.redirect("/");
//   }
//   res.render("signup.ejs", {
//     registered: false,
//     olduser: false,
//     user: false,
//   });
// },

// signUpPost: (req, res) => {
//   userHelper.doSignUp(req.body).then((userData) => {
//     let olduser = userData.status;
//     if (olduser) {
//       res.render("signup", {
//         registered: false,
//         olduser: true,
//         user: false,
//       });
//     }
//     res.render("signup", { registered: true, olduser: false, user: false });
//   });
// },

// loginPage: (req, res) => {
//   if (req.session.loggedIn) {
//     res.redirect("/");
//   } else {
//     res.render("login", { loginErr: false, user: false });
//   }
// },

// loginPost: (req, res) => {
//   console.log("hi iam here");
//   userHelper.doLogin(req.body).then((response) => {
//     if (response.status) {
//       req.session.loggedIn = true;
//       req.session.user = response.validUser;
//       res.redirect("/");
//     } else {
//       res.render("login", { loginErr: true, user: false });
//     }
//   });
// },

