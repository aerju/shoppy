
var express = require('express');
var router = express.Router();
const userHelper = require('../helpers/user-helpers')
const adminHelper = require('../helpers/admin-helpers');
const productHelper = require('../helpers/product-helpers');

const { response } = require('../app');

const admin = require('firebase-admin');



const serviceAccount = require('../firebase-admin.json');
const speakeasy = require('speakeasy');


// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
// });

// admin.initializeApp(serviceAccount);

let cartcount = null

let message


module.exports = {


    userHome: async (req, res, next) => {
        let user = req.session.user

        let wishlistItems

        if (req.session.user) {
            cartcount = await productHelper.getCartCount(user._id)
            req.session.user.cartCount = cartcount
            wishlistItems = await productHelper.getWishlistProducts(user._id)
        }
        let banner = await adminHelper.getBannerInfo()


        adminHelper.getProductInfo().then((products) => {
            adminHelper.viewAllCategories().then((category) => {

                // console.log(wishlistItems,'wishlist',products,'products');

                if (req.session.userLoggedIn) {

                    res.render('user/userLandingPage', { userHead: true, user, products, category, cartcount, banner, });

                } else {
                    res.render('user/userLandingPage', { userHead: false, user, products, category, cartcount, banner });

                }
            })

        })

    },
    userLogin: (req, res, next) => {
        res.render('user/userLogin', { userHead: false, 'loggedError': req.session.loggedError });

        req.session.loggedError = false
    },
    userLoginPost: (req, res) => {
        // console.log(req.body);
        userHelper.doLogin(req.body).then((response) => {

            console.log(response);
            if (response.status) {
                req.session.userLoggedIn = true
                req.session.user = response.user

                res.redirect('/')
            } else {
                req.session.loggedError = "Invalid user name or password"
                console.log(req.session.loggedError);
                res.redirect('/login')
            }
        })

    },updateProfile:(req,res)=>{
        let userId=req.params.id

        userHelper.updateProfileInfo(req.body,userId).then((response)=>{
            res.redirect('/profile')
        })

    },





    userLOginWithOtp: (req, res) => {
        res.render('user/loginOtp', { message })
        message = ""

    }, userLOginWithOtpPost: (req, res) => {
        let number = req.body.number

        let status = req.body.otpVerify


        userHelper.doOtplogin(number).then((response) => {
            console.log(response, 'iiiiiiiiiiiiiiiiiiiiiiiiiiiiii');



            if (response) {
                res.json({
                    validate: true

                })

            } else {
                res.json({
                    validate: false

                })

            }
        })

    }, verifyOpt: (req, res) => {
        let number = req.body.number
        // console.log(number, 'ooooooooooooooooooooooooooooo');
        userHelper.doOtplogin(number).then((response) => {

            req.session.userLoggedIn = true
            req.session.user = response
            res.json(response)

        })
    },



    forgortPassword: (req, res) => {
        res.render('user/forgotPassword', { message })
        message = ''


    },


    forgortPasswordPOst: (req, res) => {
        let number = req.body.number

        let status = req.body.otpVerify


        userHelper.doOtplogin(number).then((response) => {
            // console.log(response,'iiiiiiiiiiiiiiiiiiiiiiiiiiiiii');

            if (status) {
                req.session.userLoggedIn = true
                req.session.user = response
            }

            if (response) {
                res.json({
                    validate: true

                })

            } else {
                res.json({
                    validate: false

                })

            }
        })

    }, updatePassword: async (req, res) => {

        let users = await userHelper.doOtplogin(req.body.number)
        userHelper.updatePassword(users._id, req.body.password).then((response) => {
            req.session.userLoggedIn = true
            req.session.user = users
            res.json(response)
        })

    },



    userSignUp: (req, res, next) => {
        res.render('user/userSignup', { title: 'Express' });
    },
    userSignUpPost: (req, res) => {
        console.log(req.body);

        userHelper.doSignup(req.body).then((response) => {
            req.session.userLoggedIn = true
            req.session.user = response.user
            res.redirect('/')
        })






    }, userLogOut: (req, res) => {
        req.session.destroy()
        res.redirect('/')
    },
    userViewSingleProduct: async (req, res) => {
        let user = req.session.user

        let product = await adminHelper.getOneProduct(req.params.id)
        // console.log(product.image);


        if (req.session.userLoggedIn) {
            cartcount = await productHelper.getCartCount(user._id)

            res.render('user/singleProductView', { userHead: true, user, product, cartcount });

        } else {
            res.render('user/singleProductView', { userHead: false, user, product, cartcount });

        }

    },



    userCategory: async (req, res) => {
        let user = req.session.user
        let categoryDetails = await productHelper.getCategory(req.params.id)
        adminHelper.viewAllCategories().then((category) => {

            adminHelper.getProductInfo().then(async (products) => {

                if (req.session.userLoggedIn) {
                    // cartcount = await productHelper.getCartCount(user._id)


                    res.render('user/category', { userHead: true, user, products, cartcount, category, categoryDetails });

                } else {
                    res.render('user/category', { userHead: false, user, products, cartcount, category, categoryDetails });

                }

            })
        })





    },
    viewCart: async (req, res) => {
        let user = req.session.user
        cartcount = await productHelper.getCartCount(user._id)
        let cartItems = await productHelper.getCartProducts(user._id)
        console.log(cartItems, 'llllllllllllllllllllllllllll');

        let totalValue = 0
        let cartStockOut = false
        if (cartItems.length > 0) {
            totalValue = await productHelper.getTotalAmount(user._id)

            cartItems.forEach(function (products) {

                products.product.proTotal=products.quantity * products.product.pro_price
                // if (products.product.pro_count) {
                    if (products.product.pro_count == 0) {
                        cartStockOut = true
                    }
                // }
            });
        }


        res.render('user/viewCart', { userHead: true, user, cartItems, cartcount, totalValue, cartStockOut })

    }, addToCart: (req, res) => {
        productHelper.addTOCart(req.params.id, req.session.user._id).then(() => {
            // res.redirect('/')

            console.log(req.params.id, 'pppppppppppppppppppppppppppppppppppppppppppppppp');
            res.json({
                status: true
            })
        })


    }, changePoductQuantity: (req, res) => {

        productHelper.changeQunatity(req.body).then(async (response) => {
            console.log(response,';;;;;;;;;;;;;;;;;;;;;;;;');
            response.total = await productHelper.getTotalAmount(req.body.user)

            res.json(response)

        })


    }, removeCartProducts: (req, res) => {
        // let pro_ID = req.params.id
        // console.log(pro_ID,'ppppppppppppppppppppppppppppppppppppppppppp');
        productHelper.removeCartproduct(req.body).then((response) => {
            res.json(response)

        })
    },

    userCheckOut: async (req, res) => {
        let user = req.session.user
        let cartcount = req.session.user.cartCount
        let total = await productHelper.getTotalAmount(user._id)
        let addresdetails = await userHelper.getAddressInfo(user._id)
        let cartItems = await productHelper.getCartProducts(user._id)
        console.log(cartItems, '///////////////////////');


        // console.log(user,'ppppppppppppppppppppppppppppppppppppppppp');
        res.render('user/checkout', { user, cartcount, total, addresdetails })


    }, userCheckOutPost: async (req, res) => {
        let user = req.session.user

        // console.log(req.body, '4444444444444444444444444444');

        let products = await productHelper.getCartProductList(user._id)

        // console.log(products,'yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy');
        // let totalPrice = await productHelper.getTotalAmount(user._id)
        let address = await userHelper.getOrderAddress(req.body, user._id)
        let totalPrice = parseInt(req.body.totalAmount)

        productHelper.checkOut(user._id, req.body, products, totalPrice, address).then((orderId) => {
            // console.log(req.body, 'uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu');


            if (req.body['payment-method'] === 'COD') {

                res.json({
                    codSuccess: true
                })


            }
            else {
                userHelper.gererateRazopay(orderId, totalPrice).then((response) => {
                    res.json(response)
                    console.log(response, 'iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii');

                })
            }

        })

    },
    orderSuccess: (req, res) => {
        res.render('user/order-success')

    },
    viewOrders: async (req, res) => {
        let user = req.session.user
        let cartcount = req.session.user.cartCount
        let orderDetails = await productHelper.getOrderDetails(user._id)
        const months = ["JAN","FEB","MARCH","APRIL","MAY","JUNE","JULY","AUG","SEP","OCT","NOV","DEC"];
            for(let i=0;i<orderDetails.length;i++){
                orderDetails[i].date = orderDetails[i].date.getDate()+'-'+months[orderDetails[i].date.getMonth()]+'-'+orderDetails[i].date.getFullYear();
            }


        res.render('user/viewUserOrders', { user, cartcount, orderDetails })



    }, viewOrderProducts: async (req, res) => {
        let user = req.session.user
        let cartcount = req.session.user.cartCount
        // let orderProduct = await productHelper.getOrderProduct(req.params.id)
        let orderDetails = await adminHelper.viewSingleOrder(req.params.id)
        const months = ["JAN","FEB","MARCH","APRIL","MAY","JUNE","JULY","AUG","SEP","OCT","NOV","DEC"];
            
                orderDetails.date = orderDetails.date.getDate()+'-'+months[orderDetails.date.getMonth()]+'-'+orderDetails.date.getFullYear();
        
        
        res.render('user/viewOrderProduct', { user, cartcount, orderDetails })
    },
    verifyPaymentPost: (req, res) => {
        console.log(req.body, '--------------------------------------------');
        userHelper.verifyPayment(req.body).then(() => {
            userHelper.changePaymentStatus(req.body['order[receipt]']).then(() => {
                res.json({ status: true })

            })
        }).catch((err) => {
            res.json({ status: false })
        })

    },
    viewWishlist: async (req, res) => {
        let user = req.session.user
        let cartcount = req.session.user.cartCount
        let wishlistItems = await productHelper.getWishlistProducts(user._id)

        res.render('user/wishList', { user, cartcount, wishlistItems })


    }, addtowishlist: (req, res) => {

        console.log(req.params.id, req.session.user._id);

        productHelper.addTowishlist(req.params.id, req.session.user._id).then(() => {
            // res.redirect('/')
            res.json({
                status: true
            })
        })

    },removeWishlistProducts: (req, res) => {

        console.log(req.body,'kkkkl');
       
        productHelper.removeWishlistProduct(req.body).then((response) => {
            res.json(response)

        })
    },
    
    
    
    userViewProfile: async (req, res) => {
        let user = req.session.user
        let userData=await userHelper.getUserDta(user._id)



        let cartcount = req.session.user.cartCount
        res.render('user/userProfile', { user,userData, cartcount })

    },
    manageAddress: async (req, res) => {
        let user = req.session.user
        let cartcount = req.session.user.cartCount
        let addresdetails = await userHelper.getAddressInfo(user._id)

        console.log(addresdetails, '/////////////////////////////////');

        res.render('user/manageAddress', { user, cartcount, addresdetails })

    },
    addAddress: (req, res) => {
        let user = req.session.user
        userHelper.addAddres(req.body, user._id).then(() => {
            res.redirect('/manage-address')

        })

    }, applycoupone: async (req, res) => {
        let user = req.session.user
        console.log(req.body);
        let coupone = await userHelper.applyCoupone(req.body, user._id)
        // console.log(coupone);
        if (coupone.couponeStatus) {
            res.json({ status: true, coupone })


        } else {
            res.json({ status: false })


        }


    }, deleteAddress: (req, res) => {
        let user = req.session.user

        console.log(req.body);

        userHelper.deleteUserAddress(req.body, user._id).then((response) => {
            res.json({ status: true })
        })

    }, editAddress: (req, res) => {
        let user = req.session.user
        userHelper.editUserAddress(req.body, user._id).then((response) => {
            // console.log(response,'.........................');
            res.json(response)
        })



    },updateAddress:(req, res) => {
        let user = req.session.user

        console.log(req.body,',,,,,,,,,,,,,');
        userHelper.updateAddressInfo(req.body, user._id).then((response) => {
            // console.log(response,'.........................');
            res.json(response)
        })



    },

    search: async (req, res) => {

        let user = req.session.user

        const searchValue = req.query.search;
        const filter = req.query.filter;
        const sort = req.query.sort;

        const page = parseInt(req.query.page || 1, 10);
        const pageSize = parseInt(req.query.pageSize || 10, 10);


        // console.log(searchValue,filter,'both,,,,,,,');



        if (req.session.user) {
            cartcount = await productHelper.getCartCount(user._id)
            req.session.user.cartCount = cartcount

        }
        let banner = await adminHelper.getBannerInfo()

        adminHelper.getProductInfo().then((products) => {
            adminHelper.viewAllCategories().then((category) => {

                if (req.session.userLoggedIn) {

                    if (filter) {
                        // console.log(searchValue,'filter function callled..............');
                        productHelper.filterdSearch({ search: searchValue }, filter, page, pageSize).then((products) => {
                            // const totalPages = Math.ceil(products / pageSize);
                            const totalPages = Object.keys(products).length;



                            res.render('user/searchedProducts', { userHead: true, user, products, category, cartcount, banner, searchValue, page, pageSize, totalPages });

                        }).catch((err) => {
                            res.json({
                                status: 'error',
                                // message: err.message
                            });
                        });

                    } else {
                        // console.log('Not filter function callled..............');

                        if (sort) {
                            productHelper.sortedProduct(sort, page, pageSize).then((products) => {
                                const totalPages = Object.keys(products).length;



                                res.render('user/searchedProducts', { userHead: true, user, products, category, cartcount, banner, searchValue, page, pageSize, totalPages });


                            }).catch((err) => {
                                res.json({
                                    status: 'error',
                                    // message: err.message
                                });
                            });

                        } else {
                            productHelper.search({ search: searchValue }, page, pageSize).then((products) => {
                                const totalPages = Object.keys(products).length;



                                res.render('user/searchedProducts', { userHead: true, user, products, category, cartcount, banner, searchValue, page, pageSize, totalPages });


                            }).catch((err) => {
                                res.json({
                                    status: 'error',
                                    // message: err.message
                                });
                            });

                        }

                    }


                }

                else {
                    if (filter) {
                        console.log(searchValue, 'filter function callled..............');
                        productHelper.filterdSearch({ search: searchValue }, filter, page, pageSize).then((products) => {
                            const totalPages = Object.keys(products).length;



                            res.render('user/searchedProducts', { userHead: false, user, products, category, cartcount, banner, searchValue, page, pageSize, totalPages });


                        }).catch((err) => {
                            res.json({
                                status: 'error',
                                // message: err.message
                            });
                        });


                    } else {
                        console.log('Not filter function callled..............');
                        if (sort) {
                            productHelper.sortedProduct(sort, page, pageSize).then((products) => {
                                const totalPages = Object.keys(products).length;



                                res.render('user/searchedProducts', { userHead: false, user, products, category, cartcount, banner, searchValue, page, pageSize, totalPages });


                            }).catch((err) => {
                                res.json({
                                    status: 'error',
                                    // message: err.message
                                });
                            });

                        } else {
                            productHelper.search({ search: searchValue }, page, pageSize).then((products) => {
                                const totalPages = Object.keys(products).length;



                                res.render('user/searchedProducts', { userHead: false, user, products, category, cartcount, banner, searchValue, page, pageSize, totalPages });


                            }).catch((err) => {
                                res.json({
                                    status: 'error',
                                    // message: err.message
                                });
                            });

                        }



                    }
                }
            })

        })
    }, cancelRequest: (req, res) => {
        // let orderid=req.body.orderId



        console.log(req.body.orderId, '[[[[[[[[[[[[[[[[[[[[[[[[');
        let orderid = req.body.orderId


        userHelper.cancelOrderRequest(orderid).then(() => {
            res.json(true)

        })

    }, returnRequest:(req, res) => {
        // let orderid=req.body.orderId

        // console.log(req.body.orderId, '[[[[[[[[[[[[[[[[[[[[[[[[');
        let orderid = req.body.orderId
        userHelper.returnOrderRequest(orderid).then(() => {
            res.json(true)

        })

    },
    
    
    wallet: async (req, res) => {
        let user = req.session.user
        let cartcount = req.session.user.cartCount

        let wallet = await userHelper.getWalletInfo(user._id)
        res.render('user/wallet', { user, cartcount, wallet })

    },







    getOpt: (req, res) => {
        // const phoneNum = req.body.phone
        // const auth = admin.auth();

        // auth.languageCode = 'en'; 
        // auth.sendSignInLinkToPhone(phoneNum)
        //     .then((verificationId) => {

        //         console.log('Verification ID:', verificationId);
        //     })
        //     .catch((error) => {
        //         console.error('Error sending OTP:', error);
        //     });


        // const secret = speakeasy.generateSecret({ length: 20 });

        // const otp = speakeasy.totp({
        //     secret: secret.base32,
        //     encoding: 'base32'
        // });

        // console.log('OTP:', otp);

        // const verificationId = await phoneAuthProvider.verifyPhoneNumber({
        //     phoneNumber: '+15555555555',
        //     code: otp
        // });



        // user_phone_number = req.body.phone
        // otp = auth.generate_phone_verification_code(user_phone_number)
        // print("OTP:", otp)
    }


}