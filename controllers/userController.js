var express = require("express");
var router = express.Router();
const userHelper = require("../helpers/user-helpers");
const adminHelper = require("../helpers/admin-helpers");
const productHelper = require("../helpers/product-helpers");

const { response, request } = require("../app");

const admin = require("firebase-admin");

const serviceAccount = require("../firebase-admin.json");
const speakeasy = require("speakeasy");

let cartcount = 0;

let message;

let userExistMsg, loginMsg;

module.exports = {
  userHome: async (req, res, next) => {
   
    const page = parseInt(req.query.page || 1);
    const pageSize = parseInt(req.query.pageSize || 12);
    const skip = (page - 1) * pageSize;
    const limit = pageSize;

    let userHomeActive = "active";
    let user = req.session.user;

    let wishlistItems;
    let products = await adminHelper.getProductInfo(skip, limit);

    let total = Object.keys(products).length;
    

    const totalPages = Math.ceil(total / pageSize)+1

    if (req.session.user) {
      cartcount = await productHelper.getCartCount(user._id);
      req.session.user.cartCount = cartcount;

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
          page, total
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
          page,total
        });
      }
    });
  },

  userLogin: async (req, res, next) => {
    let user = null;
    let category = await adminHelper.viewAllCategories();
    res.render("user/loginPage", {
      user,
      userHead: false,
      loginMsg,
      category,
    });

    loginMsg = "";
  },
  userLoginPost: (req, res) => {
    // console.log(req.body);
    userHelper.doLogin(req.body).then((response) => {
      console.log(response);
      if (response.status) {
        req.session.userLoggedIn = true;
        req.session.user = response.user;

        res.redirect("/");
      } else {
        loginMsg = response.loggedError;
        res.redirect("/login");
      }
    });
  },
  updateProfile: (req, res) => {
    let userId = req.params.id;

    userHelper.updateProfileInfo(req.body, userId).then((response) => {
      res.redirect("/profile");
    });
  },

  userLOginWithOtp: async (req, res) => {
    let user = null;
    let category = await adminHelper.viewAllCategories();
    res.render("user/loginPageWithOtp", {
      message,
      user,
      userHead: false,
      category,
    });
    message = "";
  },
  userLOginWithOtpPost: (req, res) => {
    let number = req.body.number;

    let status = req.body.otpVerify;

    userHelper.doOtplogin(number).then((response) => {
      console.log(response, "iiiiiiiiiiiiiiiiiiiiiiiiiiiiii");

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
  },
  verifyOpt: (req, res) => {
    let number = req.body.number;
    // console.log(number, 'ooooooooooooooooooooooooooooo');
    userHelper.doOtplogin(number).then((response) => {
      req.session.userLoggedIn = true;
      req.session.user = response;
      res.json(response);
    });
  },

  forgortPassword: async (req, res) => {
    let user = null;
    let category = await adminHelper.viewAllCategories();
    res.render("user/forgotPasswordPage", {
      message,
      user,
      userHead: false,
      category,
    });
    message = "";
  },

  forgortPasswordPOst: (req, res) => {
    let number = req.body.number;
    console.log(number, "llll");
    let status = req.body.otpVerify;

    userHelper.doOtplogin(number).then((response) => {
      // console.log(response,'iiiiiiiiiiiiiiiiiiiiiiiiiiiiii');

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
  },
  updatePassword: async (req, res) => {
    let users = await userHelper.doOtplogin(req.body.number);
    userHelper.updatePassword(users._id, req.body.password).then((response) => {
      req.session.userLoggedIn = true;
      req.session.user = users;
      res.json(response);
    });
  },

  userSignUp: async (req, res, next) => {
    let user = null;
    let category = await adminHelper.viewAllCategories();
    res.render("user/signupPage", {
      userExistMsg,
      user,
      userHead: false,
      category,
    });
    userExistMsg = "";
  },
  userSignUpPost: (req, res) => {
    console.log(req.body);

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
  },

  userLogOut: (req, res) => {
    // req.session.use=null
    // req.session.userLoggedIn=false
    req.session.destroy();
    res.redirect("/");
  },
  userViewSingleProduct: async (req, res) => {
    let user = req.session.user;

    let product = await adminHelper.getOneProduct(req.params.id);
    // console.log(product.image);

    if (req.session.userLoggedIn) {
      cartcount = await productHelper.getCartCount(user._id);

      res.render("user/singleProductView", {
        userHead: true,
        user,
        product,
        cartcount,
      });
    } else {
      res.render("user/singleProductView", {
        userHead: false,
        user,
        product,
        cartcount,
      });
    }
  },

  userCategory: async (req, res) => {
    let userCategoryActive = "active";
    let user = req.session.user;
    let categoryDetails = await productHelper.getCategory(req.params.id);
    adminHelper.viewAllCategories().then((category) => {
      adminHelper.getProductInfoAdmin().then(async (products) => {
        if (req.session.userLoggedIn) {
          // cartcount = await productHelper.getCartCount(user._id)

          res.render("user/category", {
            userHead: true,
            user,
            products,
            cartcount,
            category,
            categoryDetails,
            userCategoryActive,
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
          });
        }
      });
    });
  },
  viewCart: async (req, res) => {
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
    });
  },
  addToCart: (req, res) => {
    productHelper.addTOCart(req.params.id, req.session.user._id).then(() => {
      res.json({
        status: true,
      });
    });
  },
  changePoductQuantity: (req, res) => {
    productHelper.changeQunatity(req.body).then(async (response) => {
      response.total = await productHelper.getTotalAmount(req.body.user);

      res.json(response);
    });
  },
  removeCartProducts: (req, res) => {
    productHelper.removeCartproduct(req.body).then((response) => {
      res.json({ productRemoved: true });
    });
  },

  userCheckOut: async (req, res) => {
    let user = req.session.user;
    cartcount = await productHelper.getCartCount(user._id);
    let total = await productHelper.getTotalAmount(user._id);
    let addresdetails = await userHelper.getAddressInfo(user._id);

    let cartItems = await productHelper.getCartProducts(user._id);
    // let wallet = await userHelper.getWalletInfo(user._id);
    let wallet = await userHelper.getWalletInfo(user._id);

    res.render("user/checkout", {
      user,
      cartcount,
      total,
      addresdetails,
      wallet,
    });
  },
  userCheckOutPost: async (req, res) => {
    console.log(req.body);
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
            console.log(response, "iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii");
          });
        }
      });
  },
  orderSuccess: async (req, res) => {
    let user = req.session.user;

    let category = await adminHelper.viewAllCategories();
    cartcount = await productHelper.getCartCount(user._id);

    res.render("user/orderConfirmedPage", {
      user,
      category,
      userHead: true,
      cartcount,
    });
  },
  viewOrders: async (req, res) => {
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

    res.render("user/viewUserOrders", { user, cartcount, orderDetails });
  },
  viewOrderProducts: async (req, res) => {
    let user = req.session.user;
    cartcount = await productHelper.getCartCount(user._id);
    // let orderProduct = await productHelper.getOrderProduct(req.params.id)
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

    res.render("user/viewOrderProduct", { user, cartcount, orderDetails });
  },
  verifyPaymentPost: (req, res) => {
    let user = req.session.user;
    console.log(req.body, "--------------------------------------------");
    userHelper
      .verifyPayment(req.body)
      .then(() => {
        // console.log(req.body["order[receipt]"],'jjjjjjjjiiiiiioooooo');
        userHelper
          .changePaymentStatus(req.body["order[receipt]"], user._id)
          .then(() => {
            res.json({ status: true });
          });
      })
      .catch((err) => {
        res.json({ status: false });
      });
  },
  viewWishlist: async (req, res) => {
    let user = req.session.user;
    cartcount = await productHelper.getCartCount(user._id);
    let wishlistItems = await productHelper.getWishlistProducts(user._id);

    res.render("user/wishList", { user, cartcount, wishlistItems });
  },
  addtowishlist: (req, res) => {
    console.log(req.params.id, req.session.user._id);

    productHelper
      .addTowishlist(req.params.id, req.session.user._id)
      .then(() => {
        // res.redirect('/')
        res.json({
          status: true,
        });
      });
  },
  removeWishlistProducts: (req, res) => {
    let user = req.session.user;
    // console.log(user._id);
    // console.log(req.body);

    productHelper.removeWishlistProduct(req.body, user._id).then((response) => {
      res.json(response);
    });
  },

  userViewProfile: async (req, res) => {
    let user = req.session.user;
    let userData = await userHelper.getUserDta(user._id);

    cartcount = req.session.user.cartCount;
    res.render("user/userProfile", { user, userData, cartcount });
  },
  manageAddress: async (req, res) => {
    let user = req.session.user;
    cartcount = await productHelper.getCartCount(user._id);
    let addresdetails = await userHelper.getAddressInfo(user._id);

    console.log(addresdetails, "/////////////////////////////////");

    res.render("user/manageAddress", { user, cartcount, addresdetails });
  },
  addAddress: (req, res) => {
    let user = req.session.user;
    userHelper.addAddres(req.body, user._id).then(() => {
      res.redirect("/manage-address");
    });
  },
  applycoupone: async (req, res) => {
    let user = req.session.user;
    console.log(req.body);
    let coupone = await userHelper.applyCoupone(req.body, user._id);
    // console.log(coupone);
    if (coupone.couponeStatus) {
      res.json({ status: true, coupone });
    } else {
      console.log(coupone);
      res.json({ status: false, coupone });
    }
  },
  deleteAddress: (req, res) => {
    let user = req.session.user;

    console.log(req.body);

    userHelper.deleteUserAddress(req.body, user._id).then((response) => {
      res.json({ status: true });
    });
  },
  editAddress: (req, res) => {
    let user = req.session.user;
    userHelper.editUserAddress(req.body, user._id).then((response) => {
      // console.log(response,'.........................');
      res.json(response);
    });
  },
  updateAddress: (req, res) => {
    let user = req.session.user;

    console.log(req.body, ",,,,,,,,,,,,,");
    userHelper.updateAddressInfo(req.body, user._id).then((response) => {
      // console.log(response,'.........................');
      res.json(response);
    });
  },

  search: async (req, res) => {
    const searchValue = req.query.search;

    const { search, sort, minPrice, maxPrice } = req.query;

    const page = parseInt(req.query.page || 1, 10);
    const pageSize = parseInt(req.query.pageSize || 10, 10);
    const skip = (page - 1) * pageSize;
    const limit = pageSize;

    const query = {};

    if (search) {
      query.pro_name = { $regex: search, $options: "i" };
    }

    if (minPrice || maxPrice) {
      // const [field, value] = filter.split(":");
      // query[field] = value;
      // query.pro_price=filter
      // const filterObj = JSON.parse(filter);
      // Object.assign(query, filterObj);
      query.pro_price = {};
      if (minPrice) {
        query.pro_price.$gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        query.pro_price.$lte = parseFloat(maxPrice);
      }
    }

    // Build MongoDB sort object based on query parameters
    const sortObj = {};
    if (sort) {
      const [field, order] = sort.split(":");
      sortObj[field] = order === "desc" ? -1 : 1;
    }

    console.log(query, "query", sortObj, "sort obj");

    let banner = await productHelper.getUserBannerInfo();
    let user = req.session.user;
    let category = await adminHelper.viewAllCategories();
    let products = await productHelper.search(query, sortObj, skip, limit);

    let totalPages = Object.keys(products).length;

    if (req.session.user) {
      cartcount = await productHelper.getCartCount(user._id);

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
      });
    }
  },

  cancelRequest: (req, res) => {
    // let orderid=req.body.orderId

    console.log(req.body, "[[ttty[[[[[[[[[[[[[[[[[[[[[[");
    let orderid = req.body.orderId;

    userHelper.cancelOrderRequest(req.body).then(() => {
      res.json(true);
    });
  },

  returnRequest: (req, res) => {
    // let orderid=req.body.orderId

    // console.log(req.body.orderId, '[[[[[[[[[[[[[[[[[[[[[[[[');
    let orderid = req.body.orderId;
    userHelper.returnOrderRequest(orderid).then(() => {
      res.json(true);
    });
  },

  wallet: async (req, res) => {
    let user = req.session.user;
    cartcount = await productHelper.getCartCount(user._id);

    let wallet = await userHelper.getWalletInfo(user._id);

    res.render("user/wallet", { user, cartcount, wallet });
  },

  getOpt: (req, res) => {},
  contact: async (req, res) => {
    let userContactActive = "active";
    let user = req.session.user;
    if (req.session.user) {
      cartcount = await productHelper.getCartCount(user._id);
      res.render("user/contact", {
        userHead: true,
        user,
        cartcount,
        userContactActive,
      });
    } else {
      res.render("user/contact", { userHead: false, user, userContactActive });
    }
  },

  downloadInvoice: async (req, res) => {
    let invoiceData = await userHelper.getInvoiceInfo(req.params.id);
    res.render("user/invoice", { invoiceData });
  },
};
