var express = require("express");
var router = express.Router();
const adminHelper = require("../helpers/admin-helpers");
const productHelper = require("../helpers/product-helpers");

const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");

const userHelpers = require("../helpers/user-helpers");

let message;
let couponMessage;

module.exports = {
  adminLogin: (req, res, next) => {
    if (req.session.adminLoggedIn) {
      res.redirect("/admin/home");
    } else {
      res.render("admin/adminLogin", { loggedError: req.session.loggedError });
      req.session.loggedError = false;
    }
  },

  adminHome: async (req, res) => {

    const dashActive = 'active'  
    adminHelper.viewAllCategories().then((category) => {
      res.render("admin/AdminHomePage", { category ,dashActive});
    });
  },


  adminLoginPost: (req, res) => {
    adminHelper.adminDoLogin(req.body).then((response) => {
      if (response.status) {
        req.session.adminLoggedIn = true;
        req.session.admin = response.admin;
        res.redirect("/admin/home");
      } else {
        req.session.loggedError = "Invalid user name or password";
        console.log(req.session.loggedError);
        res.redirect("/admin");
      }
    });
  },

  adminViewAllCategories: (req, res) => {
    const categoryActive = 'active'
    adminHelper.viewAllCategories().then((category) => {
      res.render("admin/categoryManage", { category ,categoryActive});
    });
  },
  adminAddCategory: (req, res) => {
    const categoryActive = 'active'
    // adminHelper.addCategory().then((category)=>{
    res.render("admin/addCategory", { category, message ,categoryActive});
    message = "";

    // })
  },
  adminAddCategoryPost: (req, res) => {
    console.log(req.body);
    adminHelper.addCategory(req.body).then((findCategory) => {
      if (findCategory) {
        message = "Category Already Exist";
        res.redirect("/admin/add-category");
      } else {
        message = "Category Added Successfully";
        res.redirect("/admin/add-category");
      }
      // res.redirect('/admin/add-category')
    });
  },
  adminEditCategory: (req, res) => {
    const categoryActive = 'active'
    
    adminHelper.editCategory(req.params.id).then((category) => {
      res.render("admin/editCategory", { category, message ,categoryActive});
      message = "";
    });
  },
  adminEditCategoryPost: (req, res) => {
    // console.log(req.body);
    adminHelper
      .editCategoryPost(req.params.id, req.body)
      .then((findCategory) => {
        if (findCategory) {
          message = "Category Already Exist";
          res.redirect("/admin/edit-category/" + req.params.id);
        } else {
          message = "Category Added Successfully";
          res.redirect("/admin/view-categories");
        }
        // res.redirect('/admin/add-category')
      });
  },

  listCategory: (req, res) => {
    let id = req.params.id;
    adminHelper.listCategory(id).then((response) => {
      res.redirect("/admin/view-categories");
    });
  },
  unListCategory: (req, res) => {
    let id = req.params.id;
    adminHelper.unListCategory(id).then((response) => {
      res.redirect("/admin/view-categories");
    });
  },

  adminViewProductDetails: (req, res) => {
    const productActive = 'active'
    adminHelper.getProductInfo().then((products) => {
      res.render("admin/productDetails", { products ,productActive});
    });
  },

  adminAddProduct: (req, res) => {
    const productActive = 'active'

    adminHelper.viewAllCategories().then((category) => {
      console.log(category);
      res.render("admin/addProduct", {
        category,
        submitStatus: req.session.submitStatus,productActive
      });
      req.session.submitStatus = false;
    });
  },

  adminAddProductPost: async (req, res) => {
    // console.log(req.body);
    // sharp(req.files[i].path)

    // .extract({ left: 0, top: 0, width: 800, height: 800 })

    // .toFile(result.url, (err, info) => {
    //     if (err) {
    //         console.log(err);
    //     } else {
    //         console.log(info);
    //     }
    // });

    try {
      console.log(
        req.files,
        "llllllllllllllllllllllllllllllllllllllllllllllllllllllllllllll"
      );
      const imgUrl = [];
      for (let i = 0; i < req.files.length; i++) {
        const result = await cloudinary.uploader.upload(req.files[i].path);

        imgUrl.push(result.url);
        console.log(result.url);
      }
      adminHelper.addProduct(req.body, async (id) => {
        adminHelper.addProductImages(id, imgUrl).then((response) => {
          console.log(response);
        });
      });
    } catch (err) {
      console.log(err);
    } finally {
      // req.session.submitStatus = "product Added"
      res.redirect("/admin/add-product");
    }
  },
  adminEditProduct: async (req, res) => {
    const productActive = 'active'
    let product = await adminHelper.getOneProduct(req.params.id);
    adminHelper.viewAllCategories().then((category) => {
      res.render("admin/editOneProduct", { product, category ,productActive});
    });
  },
  adminEditProductPost: async (req, res) => {
    try {
      const imgUrl = [];
      for (let i = 0; i < req.files.length; i++) {
        const result = await cloudinary.uploader.upload(req.files[i].path);
        imgUrl.push(result.url);
        console.log(result.url);
      }

      adminHelper.editProduct(req.params.id, req.body).then(() => {
        if (imgUrl.length != 0) {
          adminHelper
            .addProductImages(req.params.id, imgUrl)
            .then((response) => {
              console.log(response);
            });
        }
      });
    } catch (err) {
      console.log(err);
    } finally {
      res.redirect("/admin/product-details");
    }
  },

  adminDeleteProduct: (req, res) => {
    let pro_ID = req.params.id;
    adminHelper.deleteProduct(pro_ID).then((response) => {
      res.redirect("/admin/product-details");
    });
  },

  adminViewUserDetails: (req, res) => {
    const userActive = 'active'
    adminHelper.getUserInfo().then((users) => {
      console.log(users.userstatus);
      res.render("admin/userDetails", { users,userActive });
    });
  },
  adminBlockUser: (req, res) => {
    let id = req.params.id;
    adminHelper.blockUser(id).then((response) => {
      res.redirect("/admin/user-details");
    });
  },
  adminUnblockUser: (req, res) => {
    let id = req.params.id;
    adminHelper.unblockUser(id).then((response) => {
      res.redirect("/admin/user-details");
    });
  },

  viewBanners: async (req, res) => {
    const bannerActive = 'active'
    let banner = await adminHelper.getBannerInfo();
    res.render("admin/bannerManagement", { banner ,bannerActive});
  },
  addBanners: (req, res) => {
    const bannerActive = 'active'
    res.render("admin/addBanners",{bannerActive});
  },

  addBannersPost: async (req, res) => {
    try {
      console.log(req.files);
      const imgUrl = [];
      for (let i = 0; i < req.files.length; i++) {
        const result = await cloudinary.uploader.upload(req.files[i].path);
        imgUrl.push(result.url);
        console.log(result.url);
      }
      adminHelper.addBanner(req.body, async (id) => {
        adminHelper.addBannerImages(id, imgUrl).then((response) => {
          console.log(response);
        });
      });
    } catch (err) {
      console.log(err);
    } finally {
      res.redirect("/admin/add-banners");
    }
  },
  deleteBanner: (req, res) => {
    console.log(req.params.id, "ppp");
    adminHelper.removeBanner(req.params.id).then(() => {
      res.redirect("/admin/view-banners");
    });
  },

  orgerManagement: async (req, res) => {
    const orderActive = 'active'
    
    let orders = await adminHelper.getoderInfo();
   
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
    for (let i = 0; i < orders.length; i++) {
      orders[i].date =
        orders[i].date.getDate() +
        "-" +
        months[orders[i].date.getMonth()] +
        "-" +
        orders[i].date.getFullYear();
    }

    res.render("admin/orderManagement", { orders,orderActive});
  },
  singleOrder: async (req, res) => {
    const orderActive = 'active'
    let orderId = req.params.id;
    let orderDetails = await adminHelper.viewSingleOrder(orderId);

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
      console.log(orderDetails);

    res.render("admin/viewSingleOrder", { orderDetails,orderActive });
  },
  changeStatus: (req, res) => {
    console.log(req.body);
    adminHelper.changeStatus(req.body).then((response) => {
      res.json(response);
    });
  },
  viewCoupones: async (req, res) => {
    const couponActive = 'active'
    let coupones = await adminHelper.getCoponesInfo();
    res.render("admin/couponeManagement", { coupones ,couponActive});
  },
  addCoupones: (req, res) => {
    const couponActive = 'active'
    res.render("admin/addCoupones", { couponMessage ,couponActive});
    couponMessage = "";
  },
  addCouponesPost: (req, res) => {
    adminHelper.addCoupones(req.body).then((findCoupon) => {
      if (findCoupon) {
        couponMessage = 'Coupon Already Exist"';
        res.redirect("/admin/add-coupones");
      } else {
        couponMessage = "Coupon Added succesfully";
        res.redirect("/admin/add-coupones");
      }
    });
  },
  deleteCoupons: (req, res) => {
    console.log(req.params.id, "ppp");
    adminHelper.removeCoupons(req.params.id).then(() => {
      res.redirect("/admin/coupones-management");
    });
  },

  salesReport: async (req, res) => {
  
    const { start,end } = req.query;
    const query = {};

    query.orderStatus= 'Delivered'
    if (start || end) { 
        
        query.date = {};

        if (start) {
          query.date.$gte = new Date(start)
        }
        if (end) {
          query.date.$lte = new Date(end)
        }
      }

      console.log(query,'hhhhhhhhhhhhhhhhhh');

    let salesReport = await adminHelper.getSalesReport(query);

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
    for (let i = 0; i < salesReport.length; i++) {
      salesReport[i].date =
        salesReport[i].date.getDate() +
        "-" +
        months[salesReport[i].date.getMonth()] +
        "-" +
        salesReport[i].date.getFullYear();
    }
    res.render("admin/salesReport", { salesReport });
  },


  graphStatics: async (req, res) => {


    let OrderStatistics = await adminHelper.getOrdrStatistics();
    let saleStatistics = await adminHelper.getSaleStatistics();
    let categortStatics = await adminHelper.getcategortStatics();
    let totalRevenue = await adminHelper.getTotalRevenue();
    let totalOrders = await adminHelper.getTotalOrders()
    let totalProducts = await adminHelper.getTotalproducts();

    // const totalorder = Object.keys(totalOrders).length;

  
    res.json({
      OrderStatistics,
      saleStatistics,
      categortStatics,
      totalProducts,
      totalRevenue,
      totalOrders
    });
  },

  
  graphStaticsDate: async (req, res) => {
    let year = req.query.year;


    // console.log(year, ";;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;");

    let saleStatisticsDate = await adminHelper.getSaleStatisticsDate(year);

    res.json({ saleStatisticsDate });
  },
  
  graphStaticsCategory: async (req, res) => {
    let category = req.query.FilterCategory;

    // console.log(year, ";;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;");

    let OrderStatisticsCategory = await adminHelper.getSaleStatisticsCategory(category);

    res.json({ OrderStatisticsCategory });
  },

  adminLogOut: (req, res) => {
    req.session.adminLoggedIn = false;
    res.redirect("/admin");
  },
};
