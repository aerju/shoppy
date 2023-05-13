var express = require("express");
var router = express.Router();
const userHelper = require("../helpers/user-helpers");
const adminHelper = require("../helpers/admin-helpers");
const productHelper = require("../helpers/product-helpers");
// const { response, request } = require("../app");
// const admin = require("firebase-admin");
// const serviceAccount = require("../firebase-admin.json");
// const speakeasy = require("speakeasy");

let cartcount = 0;
let message;
let userExistMsg, loginMsg;

module.exports = {
  userHome: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page || 1);
      const pageSize = parseInt(req.query.pageSize || 12);
      const skip = (page - 1) * pageSize;
      const limit = pageSize;
      let userHomeActive = "active";
      let user = req.session.user;
      let wishlistItems;
      let products = await adminHelper.getProductInfo(skip, limit);
      let total = Object.keys(products).length;
      const totalPages = Math.ceil(total / pageSize) + 1;
      if (req.session.user) {
        cartcount = await productHelper.getCartCount(user._id);
        wishlistItems = await productHelper.getWishlistProducts(user._id);
        wishlistItems.forEach((wish) => {
          products.forEach((pro) => {
            if (wish.item.toString() == pro._id.toString()) {
              pro.isWish = true;
            }
          });
        });
      }
      let banner = await adminHelper.getBannerInfo();
      adminHelper.viewAllCategories().then((category) => {
        if (req.session.userLoggedIn) {
          res.render("user/userLandingPage", {
            userHead: true,
            user,
            products,
            category,
            cartcount,
            banner,
            wishlistItems,
            userHomeActive,
            totalPages,
            page,
            total,
            pageSize
          });
        } else {
          res.render("user/userLandingPage", {
            userHead: false,
            user,
            products,
            category,
            cartcount,
            banner,
            wishlistItems,
            userHomeActive,
            totalPages,
            page,
            total,
            pageSize
          });
        }
      });
    } catch (error) {
      console.log(error);
      res.render("error", { error });
    }
  },

  userLogin: async (req, res) => {
    try {
      let user = null;
      let category = await adminHelper.viewAllCategories();
      res.render("user/loginPage", {
        user,
        userHead: false,
        loginMsg,
        category,
      });
      loginMsg = "";
    } catch (error) {
      console.log(error);
      res.render("error", { error });
    }
  },

  userLoginPost: (req, res) => {
    try {
      userHelper.doLogin(req.body).then((response) => {
        if (response.status) {
          req.session.userLoggedIn = true;
          req.session.user = response.user;
          res.redirect("/");
        } else {
          loginMsg = response.loggedError;
          res.redirect("/login");
        }
      });
    } catch (error) {res.render('error',error)}
  },

  updateProfile: (req, res) => {
    try {
      let userId = req.params.id;
      userHelper.updateProfileInfo(req.body, userId).then((response) => {
        res.redirect("/profile");
      });
    } catch (error) {res.render('error',error)}
  },

  userLOginWithOtp: async (req, res) => {
    try {
      let user = null;
      let category = await adminHelper.viewAllCategories();
      res.render("user/loginPageWithOtp", {
        message,
        user,
        userHead: false,
        category,
      });
      message = "";
    } catch (error) {res.render('error',error)}
  },

  userLOginWithOtpPost: (req, res) => {
    try {
      let number = req.body.number;
      let status = req.body.otpVerify;
      userHelper.doOtplogin(number).then((response) => {
        if (response) {
          res.json({
            validate: true,
          });
        } else {
          res.json({
            validate: false,
          });
        }
      });
    } catch (error) {res.render('error',error)}
  },

  verifyOpt: (req, res) => {
    try {
      let number = req.body.number;
      userHelper.doOtplogin(number).then((response) => {
        req.session.userLoggedIn = true;
        req.session.user = response;
        res.json(response);
      });
    } catch (error) {res.render('error',error)}
  },

  forgortPassword: async (req, res) => {
    try {
      let user = null;
      let category = await adminHelper.viewAllCategories();
      res.render("user/forgotPasswordPage", {
        message,
        user,
        userHead: false,
        category,
      });
      message = "";
    } catch (error) {res.render('error',error)}
  },

  forgortPasswordPOst: (req, res) => {
    try {
      let number = req.body.number;
      let status = req.body.otpVerify;
      userHelper.doOtplogin(number).then((response) => {
        if (status) {
          req.session.userLoggedIn = true;
          req.session.user = response;
        }
        if (response) {
          res.json({
            validate: true,
          });
        } else {
          res.json({
            validate: false,
          });
        }
      });
    } catch (error) {res.render('error',error)}
  },

  updatePassword: async (req, res) => {
    try {
      let users = await userHelper.doOtplogin(req.body.number);
      userHelper
        .updatePassword(users._id, req.body.password)
        .then((response) => {
          req.session.userLoggedIn = true;
          req.session.user = users;
          res.json(response);
        });
    } catch (error) {res.render('error',error)}
  },

  userSignUp: async (req, res, next) => {
    try {
      let user = null;
      let category = await adminHelper.viewAllCategories();
      res.render("user/signupPage", {
        userExistMsg,
        user,
        userHead: false,
        category,
      });
      userExistMsg = "";
    } catch (error) {res.render('error',error)}
  },

  userSignUpPost: (req, res) => {
    try {
      userHelper.doSignup(req.body).then((response) => {
        if (response.userExitsStatus) {
          userExistMsg = "User already exists";
          res.redirect("/signup");
        } else {
          req.session.userLoggedIn = true;
          req.session.user = response.user;
          res.redirect("/");
        }
      });
    } catch (error) {res.render('error',error)}
  },

  userLogOut: (req, res) => {
    try {
      req.session.user=null
      req.session.userLoggedIn=false
      res.redirect("/");
    } catch (error) {res.render('error',error)}
  },

  userViewSingleProduct: async (req, res) => {
    try {
      let category = await adminHelper.viewAllCategories();
      let user = req.session.user;
      let product = await adminHelper.getOneProduct(req.params.id);
      if (req.session.userLoggedIn) {
        cartcount = await productHelper.getCartCount(user._id);
        res.render("user/singleProductView", {
          userHead: true,
          user,
          product,
          cartcount,
          category,
        });
      } else {
        res.render("user/singleProductView", {
          userHead: false,
          user,
          product,
          cartcount,
          category,
        });
      }
    } catch (error) {res.render('error',error)}
  },

  userCategory: async (req, res) => {
    try {
      let userCategoryActive = "active";
      let user = req.session.user;
      let catID = req.params.id;
      const page = parseInt(req.query.page || 1);
      const pageSize = parseInt(req.query.pageSize || 12);
      const skip = (page - 1) * pageSize;
      const limit = pageSize;
      let categoryDetails = await productHelper.getCategory(
        req.params.id,
        skip,
        limit
      );
      let total = Object.keys(categoryDetails).length;
      const totalPages = Math.ceil(total / pageSize) ;
      let category = await adminHelper.viewAllCategories();
      let products = await adminHelper.getProductInfoAdmin();
      if (req.session.userLoggedIn) {
        wishlistItems = await productHelper.getWishlistProducts(user._id);
        wishlistItems.forEach((wish) => {
          categoryDetails.forEach((pro) => {
            if (wish.item.toString() == pro._id.toString()) {
              pro.isWish = true;
            }
          });
        });

        res.render("user/category", {
          userHead: true,
          user,
          products,
          cartcount,
          category,
          categoryDetails,
          userCategoryActive,
          page,
          pageSize,
          total,
          totalPages,
          catID,
        });
      } else {
        res.render("user/category", {
          userHead: false,
          user,
          products,
          cartcount,
          category,
          categoryDetails,
          userCategoryActive,
          page,
          pageSize,
          total,
          totalPages,
          catID,
        });
      }
    } catch (error) {
      res.render('error',error)
    }
  },

  viewCart: async (req, res) => {
    try {
      let category = await adminHelper.viewAllCategories();
      let user = req.session.user;
      cartcount = await productHelper.getCartCount(user._id);
      let cartItems = await productHelper.getCartProducts(user._id);
      let totalValue = 0;
      let cartStockOut = false;
      if (cartItems.length > 0) {
        let totalValueObj = await productHelper.getTotalAmount(user._id);
        totalValue = totalValueObj.total;
        cartItems.forEach(function (products) {
          products.product.proTotal =
            products.quantity * products.product.pro_price;
          if (products.product.pro_count == 0) {
            cartStockOut = true;
          }
        });
      }
      res.render("user/viewCart", {
        userHead: true,
        user,
        cartItems,
        cartcount,
        totalValue,
        cartStockOut,
        category,
      });
    } catch (error) {res.render('error',error)}
  },

  getCartCound: async (req, res) => {
    try {
      let user = req.session.uder;
      cartcount = await productHelper.getCartCount(user._id);
      res.json(cartcount);
    } catch (error) {res.render('error',error)}
  },

  addToCart: (req, res) => {
    try {
      productHelper.addTOCart(req.params.id, req.session.user._id).then(() => {
        res.json({
          status: true,
        });
      });
    } catch (error) {res.render('error',error)}
  },

  changePoductQuantity: (req, res) => {
    try {
      productHelper.changeQunatity(req.body).then(async (response) => {
        response.total = await productHelper.getTotalAmount(req.body.user);
        res.json(response);
      });
    } catch (error) {res.render('error',error)}
  },

  removeCartProducts: (req, res) => {
    try {
      productHelper.removeCartproduct(req.body).then((response) => {
        res.json({ productRemoved: true });
      });
    } catch (error) {res.render('error',error)}
  },

  userCheckOut: async (req, res) => {
    try {
      let category = await adminHelper.viewAllCategories();
      let user = req.session.user;
      cartcount = await productHelper.getCartCount(user._id);
      let total = await productHelper.getTotalAmount(user._id);
      let addresdetails = await userHelper.getAddressInfo(user._id);
      let cartItems = await productHelper.getCartProducts(user._id);
      let wallet = await userHelper.getWalletInfo(user._id);
      res.render("user/checkout", {
        user,
        cartcount,
        total,
        addresdetails,
        wallet,
        category,
      });
    } catch (error) {res.render('error',error)}
  },

  userCheckOutPost: async (req, res) => {
    try {
      let user = req.session.user;
      let products = await productHelper.getCartProductList(user._id);
      let address = await userHelper.getOrderAddress(req.body, user._id);
      let totalPrice = parseInt(req.body.totalAmount);
      productHelper
        .checkOut(user._id, req.body, products, totalPrice, address)
        .then((orderId) => {
          if (
            req.body["payment-method"] === "COD" ||
            req.body["payment-method"] === "wallet"
          ) {
            res.json({
              codSuccess: true,
            });
          } else {
            userHelper.gererateRazopay(orderId, totalPrice).then((response) => {
              res.json(response);
            });
          }
        });
    } catch (error) {res.render('error',error)}
  },

  orderSuccess: async (req, res) => {
    try {
      let user = req.session.user;
      let category = await adminHelper.viewAllCategories();
      cartcount = await productHelper.getCartCount(user._id);
      res.render("user/orderConfirmedPage", {
        user,
        category,
        userHead: true,
        cartcount,
      });
    } catch (error) {res.render('error',error)}
  },

  viewOrders: async (req, res) => {
    try {
      let category = await adminHelper.viewAllCategories();
      let user = req.session.user;
      cartcount = await productHelper.getCartCount(user._id);
      let orderDetails = await productHelper.getOrderDetails(user._id);
      const months = [
        "JAN",
        "FEB",
        "MARCH",
        "APRIL",
        "MAY",
        "JUNE",
        "JULY",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC",
      ];
      for (let i = 0; i < orderDetails.length; i++) {
        orderDetails[i].date =
          orderDetails[i].date.getDate() +
          "-" +
          months[orderDetails[i].date.getMonth()] +
          "-" +
          orderDetails[i].date.getFullYear();
      }
      res.render("user/viewUserOrders", {
        user,
        cartcount,
        orderDetails,
        category,
      });
    } catch (error) {res.render('error',error)}
  },

  viewOrderProducts: async (req, res) => {
    try {
      let category = await adminHelper.viewAllCategories();
      let user = req.session.user;
      cartcount = await productHelper.getCartCount(user._id);
      let orderDetails = await adminHelper.viewSingleOrder(req.params.id);
      const months = [
        "JAN",
        "FEB",
        "MARCH",
        "APRIL",
        "MAY",
        "JUNE",
        "JULY",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC",
      ];
      orderDetails.date =
        orderDetails.date.getDate() +
        "-" +
        months[orderDetails.date.getMonth()] +
        "-" +
        orderDetails.date.getFullYear();
      res.render("user/viewOrderProduct", {
        user,
        cartcount,
        orderDetails,
        category,
      });
    } catch (error) {res.render('error',error)}
  },
  verifyPaymentPost: (req, res) => {
    try {
      let user = req.session.user;
      userHelper
        .verifyPayment(req.body)
        .then(() => {
          userHelper
            .changePaymentStatus(req.body["order[receipt]"], user._id)
            .then(() => {
              res.json({ status: true });
            });
        })
        .catch((err) => {
          res.json({ status: false });
        });
    } catch (error) {res.render('error',error)}
  },
  viewWishlist: async (req, res) => {
    try {
      let category = await adminHelper.viewAllCategories();
      let user = req.session.user;
      cartcount = await productHelper.getCartCount(user._id);
      let wishlistItems = await productHelper.getWishlistProducts(user._id);
      res.render("user/wishList", { user, cartcount, wishlistItems, category });
    } catch (error) {res.render('error',error)}
  },
  addtowishlist: (req, res) => {
    try {
      productHelper
        .addTowishlist(req.params.id, req.session.user._id)
        .then(() => {
          res.json({
            status: true,
          });
        });
    } catch (error) {res.render('error',error)}
  },
  removeWishlistProducts: (req, res) => {
    try {
      let user = req.session.user;
      productHelper
        .removeWishlistProduct(req.body, user._id)
        .then((response) => {
          res.json(response);
        });
    } catch (error) {res.render('error',error)}
  },

  viewCoupons: async (req, res) => {
    try {
      let category = await adminHelper.viewAllCategories();
      let user = req.session.user;
      cartcount = await productHelper.getCartCount(user._id);
      let coupons = await productHelper.getCoupons(user._id);
      console.log(coupons);
      res.render("user/viewCoupons", { user, cartcount, category, coupons });
    } catch (error) {res.render('error',error)}
  },

  userViewProfile: async (req, res) => {
    try {
      let category = await adminHelper.viewAllCategories();
      let user = req.session.user;
      let userData = await userHelper.getUserDta(user._id);
      cartcount = req.session.user.cartCount;
      res.render("user/userProfile", { user, userData, cartcount, category });
    } catch (error) {res.render('error',error)}
  },
  manageAddress: async (req, res) => {
    try {
      let category = await adminHelper.viewAllCategories();
      let user = req.session.user;
      cartcount = await productHelper.getCartCount(user._id);
      let addresdetails = await userHelper.getAddressInfo(user._id);
      res.render("user/manageAddress", {
        user,
        cartcount,
        addresdetails,
        category,
      });
    } catch (error) {res.render('error',error)}
  },
  addAddress: (req, res) => {
    try {
      let user = req.session.user;
      userHelper.addAddres(req.body, user._id).then(() => {
        res.redirect("/manage-address");
      });
    } catch (error) {res.render('error',error)}
  },
  applycoupone: async (req, res) => {
    try {
      let user = req.session.user;
      let coupone = await userHelper.applyCoupone(req.body, user._id);
      if (coupone.couponeStatus) {
        res.json({ status: true, coupone });
      } else {
        res.json({ status: false, coupone });
      }
    } catch (error) {res.render('error',error)}
  },
  deleteAddress: (req, res) => {
    try {
      let user = req.session.user;
      userHelper.deleteUserAddress(req.body, user._id).then((response) => {
        res.json({ status: true });
      });
    } catch (error) {res.render('error',error)}
  },
  editAddress: (req, res) => {
    try {
      let user = req.session.user;
      userHelper.editUserAddress(req.body, user._id).then((response) => {
        res.json(response);
      });
    } catch (error) {res.render('error',error)}
  },
  updateAddress: (req, res) => {
    try {
      let user = req.session.user;
      userHelper.updateAddressInfo(req.body, user._id).then((response) => {
        res.json(response);
      });
    } catch (error) {res.render('error',error)}
  },

  search: async (req, res) => {
    try {
      const searchValue = req.query.search;
      const { search, sort, minPrice, maxPrice } = req.query;
      // const page = parseInt(req.query.page || 1, 10);
      // const pageSize = parseInt(req.query.pageSize || 10, 10);
      // const skip = (page - 1) * pageSize;
      // const limit = pageSize;
      const page = parseInt(req.query.page || 1);
      const pageSize = parseInt(req.query.pageSize || 9);
      const skip = (page - 1) * pageSize;
      const limit = pageSize;
      const query = {};
      query.stockStatus = { $eq: true };
      if (search) {
        query.pro_name = { $regex: search, $options: "i" };
      }
      if (minPrice || maxPrice) {
        query.pro_price = {};
        if (minPrice) {
          query.pro_price.$gte = parseFloat(minPrice);
        }
        if (maxPrice) {
          query.pro_price.$lte = parseFloat(maxPrice);
        }
      }
      const sortObj = {};
      if (sort) {
        const [field, order] = sort.split(":");
        sortObj[field] = order === "desc" ? -1 : 1;
      }
      let banner = await productHelper.getUserBannerInfo();
      let user = req.session.user;
      let category = await adminHelper.viewAllCategories();
      let products = await productHelper.search(query, sortObj, skip, limit);
      let total = Object.keys(products).length;
      const totalPages = Math.ceil(total / pageSize) + 1;
      console.log(total, totalPages);
      if (req.session.user) {
        cartcount = await productHelper.getCartCount(user._id);
        wishlistItems = await productHelper.getWishlistProducts(user._id);
        wishlistItems.forEach((wish) => {
          products.forEach((pro) => {
            if (wish.item.toString() == pro._id.toString()) {
              pro.isWish = true;
            }
          });
        });
        res.render("user/searchProducts", {
          userHead: true,
          user,
          products,
          category,
          cartcount,
          banner,
          searchValue,
          page,
          pageSize,
          totalPages,
          sort,
          minPrice,
          maxPrice,
          total,
        });
      } else {
        res.render("user/searchProducts", {
          userHead: false,
          user,
          products,
          category,
          cartcount,
          banner,
          searchValue,
          page,
          pageSize,
          totalPages,
          sort,
          minPrice,
          maxPrice,
          total,
        });
      }
    } catch (error) {
      res.render('error',error)
    }
  },

  cancelRequest: (req, res) => {
    try {
      userHelper.cancelOrderRequest(req.body).then(() => {
        res.json(true);
      });
    } catch (error) {res.render('error',error)}
  },

  returnRequest: (req, res) => {
    try {
      userHelper.returnOrderRequest(req.body).then(() => {
        res.json(true);
      });
    } catch (error) {res.render('error',error)}
  },

  wallet: async (req, res) => {
    try {
      let user = req.session.user;
      cartcount = await productHelper.getCartCount(user._id);
      let category = await adminHelper.viewAllCategories();
      let wallet = await userHelper.getWalletInfo(user._id);
      res.render("user/wallet", { user, cartcount, wallet, category });
    } catch (error) {res.render('error',error)}
  },

  contact: async (req, res) => {
    try {
      let category = await adminHelper.viewAllCategories();
      let userContactActive = "active";
      let user = req.session.user;
      if (req.session.user) {
        cartcount = await productHelper.getCartCount(user._id);
        res.render("user/contact", {
          userHead: true,
          user,
          cartcount,
          userContactActive,
          category,
        });
      } else {
        res.render("user/contact", {
          userHead: false,
          user,
          userContactActive,
          category,
        });
      }
    } catch (error) {res.render('error',error)}
  },

  downloadInvoice: async (req, res) => {
    let invoiceData = await userHelper.getInvoiceInfo(req.params.id);
    res.render("user/invoice", { invoiceData });
  },
};
