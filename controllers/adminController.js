var express = require("express");
var router = express.Router();
const adminHelper = require("../helpers/admin-helpers");
const cloudinary = require("../utils/cloudinary");
// const productHelper = require("../helpers/product-helpers");
// const upload = require("../utils/multer");
// const userHelpers = require("../helpers/user-helpers");

let message;
let couponMessage;
let loginErrorMsg

module.exports = {
  adminLogin: (req, res, next) => {
    try {
      if (req.session.adminLoggedIn) {
        res.redirect("/admin/home");
      } else {
        res.render("admin/adminLogin", {
          loginErrorMsg
        });
        loginErrorMsg=''
      }
    } catch (error) {res.render('error',error)}
  },

  adminHome: async (req, res) => {
    try {
      const dashActive = "active";
      adminHelper.viewAllCategories().then((category) => {
        res.render("admin/adminHome", { category, dashActive });
      });
    } catch (error) {res.render('error',error)}
  },

  adminLoginPost: (req, res) => {
    try {
      adminHelper.adminDoLogin(req.body).then((response) => {     
          req.session.adminLoggedIn = true;
          req.session.admin = response.admin;
          res.redirect("/admin/home");    
      }).catch((response)=>{
          loginErrorMsg = "Invalid user name or password";
          res.redirect("/admin");

      })
    } catch (error) {res.render('error',error)}
  },

  adminViewAllCategories: (req, res) => {
    try {
      const categoryActive = "active";
      adminHelper.viewAllCategories().then((category) => {
        res.render("admin/categoryManage", { category, categoryActive });
      });
    } catch (error) {res.render('error',error)}
  },
  adminAddCategory: (req, res) => {
    try {
      const categoryActive = "active";
      // adminHelper.addCategory().then((category)=>{
      res.render("admin/addCategory", { category, message, categoryActive });
      message = "";
      // })
    } catch (error) {res.render('error',error)}
  },

  adminAddCategoryPost: (req, res) => {
    try {
      adminHelper.addCategory(req.body).then((findCategory) => {
        if (findCategory) {
          message = "Category Already Exist";
          res.redirect("/admin/add-category");
        } else {
          message = "Category Added Successfully";
          res.redirect("/admin/add-category");
        }
      });
    } catch (error) {res.render('error',error)}
  },
  adminEditCategory: (req, res) => {
    try {
      const categoryActive = "active";
      adminHelper.editCategory(req.params.id).then((category) => {
        res.render("admin/editCategory", { category, message, categoryActive });
        message = "";
      });
    } catch (error) {res.render('error',error)}
  },
  adminEditCategoryPost: (req, res) => {
    try {
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
        });
    } catch (error) {res.render('error',error)}
  },

  listCategory: (req, res) => {
    try {
      let id = req.params.id;
      adminHelper.listCategory(id).then((response) => {
        res.json({response})
      });
    } catch (error) {res.render('error',error)}
  },
  unListCategory: (req, res) => {
    try {
      let id = req.params.id;
      adminHelper.unListCategory(id).then((response) => {
        res.json({response})
      });
    } catch (error) {res.render('error',error)}
  },

  adminViewProductDetails: (req, res) => {
    try {
      const productActive = "active";
      adminHelper.getProductInfoAdmin().then((products) => {
        res.render("admin/productDetails", { products, productActive });
      });
    } catch (error) {res.render('error',error)}
  },

  adminAddProduct: (req, res) => {
    try {
      const productActive = "active";
      adminHelper.viewAllCategories().then((category) => {
        res.render("admin/addProduct", {
          category,
          submitStatus: req.session.submitStatus,
          productActive,
        });
        req.session.submitStatus = false;
      });
    } catch (error) {res.render('error',error)}
  },

  adminAddProductPost: async (req, res) => {
    try {
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

      const imgUrl = [];
      for (let i = 0; i < req.files.length; i++) {
        const result = await cloudinary.uploader.upload(req.files[i].path);
        imgUrl.push(result.url);
      }
      adminHelper.addProduct(req.body, async (id) => {
        adminHelper.addProductImages(id, imgUrl).then((response) => {});
      });
    } catch (err) {
      console.log(err);
    } finally {
      res.redirect("/admin/add-product");
    }
  },

  adminEditProduct: async (req, res) => {
    try {
      const productActive = "active";
      let product = await adminHelper.getOneProduct(req.params.id);
      adminHelper.viewAllCategories().then((category) => {
        res.render("admin/editProduct", { product, category, productActive });
      });
    } catch (error) {res.render('error',error)}
  },

  adminEditProductPost: async (req, res) => {
    try {
      const imgUrl = [];
      for (let i = 0; i < req.files.length; i++) {
        const result = await cloudinary.uploader.upload(req.files[i].path);
        imgUrl.push(result.url);
      }

      adminHelper.editProduct(req.params.id, req.body).then(() => {
        if (imgUrl.length != 0) {
          adminHelper
            .addProductImages(req.params.id, imgUrl)
            .then((response) => {
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
    try {
      let pro_ID = req.params.id;
      adminHelper.deleteProduct(pro_ID).then((response) => {
        res.json({response});
      });
    } catch (error) {res.render('error',error)}
  },

  adminViewUserDetails: (req, res) => {
    try {
      const userActive = "active";
      adminHelper.getUserInfo().then((users) => {
        res.render("admin/userDetails", { users, userActive });
      });
    } catch (error) {res.render('error',error)}
  },
  adminBlockUser: (req, res) => {
    try {
      let id = req.params.id;
      adminHelper.blockUser(id).then((response) => {
        res.json({response})
      });
    } catch (error) {res.render('error',error)}
  },
  adminUnblockUser: (req, res) => {
    try {
      let id = req.params.id;
      adminHelper.unblockUser(id).then((response) => {
        res.json({response})
      });
    } catch (error) {res.render('error',error)}
  },

  viewBanners: async (req, res) => {
    try {
      const bannerActive = "active";
      let banner = await adminHelper.getBannerInfo();
      res.render("admin/bannerManagemen", { banner, bannerActive });
    } catch (error) {res.render('error',error)}
  },
  addBanners: (req, res) => {
    try {
      const bannerActive = "active";
      res.render("admin/addBanners", { bannerActive });
    } catch (error) {res.render('error',error)}
  },

  addBannersPost: async (req, res) => {
    try {
      const imgUrl = [];
      for (let i = 0; i < req.files.length; i++) {
        const result = await cloudinary.uploader.upload(req.files[i].path);
        imgUrl.push(result.url);
      }
      adminHelper.addBanner(req.body, async (id) => {
        adminHelper.addBannerImages(id, imgUrl).then((response) => {});
      });
    } catch (err) {
      console.log(err);
    } finally {
      res.redirect("/admin/add-banners");
    }
  },

  deleteBanner: (req, res) => {
    try {
      adminHelper.removeBanner(req.params.id).then((response) => {
        res.json(response)
      });
    } catch (error) {res.render('error',error)}
  },

  orderManagement: async (req, res) => {
    try {
      const orderActive = "active";
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
      res.render("admin/orderManagement", { orders, orderActive });
    } catch (error) {res.render('error',error)}
  },
  singleOrder: async (req, res) => {
    try {
      const orderActive = "active";
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
      res.render("admin/viewSingleOrder", { orderDetails, orderActive });
    } catch (error) {res.render('error',error)}
  },

  changeStatus: (req, res) => {
    try {
      adminHelper.changeStatus(req.body).then((response) => {
        res.json(response);
      });
    } catch (error) {res.render('error',error)}
  },
  viewCoupones: async (req, res) => {
    try {
      const couponActive = "active";
      let coupones = await adminHelper.getCoponesInfo();
      res.render("admin/couponeManagement", { coupones, couponActive });
    } catch (error) {res.render('error',error)}
  },
  addCoupones: (req, res) => {
    try {
      const couponActive = "active";
      res.render("admin/addCoupones", { couponMessage, couponActive });
      couponMessage = "";
    } catch (error) {res.render('error',error)}
  },
  addCouponesPost: (req, res) => {
    try {
      adminHelper.addCoupones(req.body).then((findCoupon) => {
        if (findCoupon) {
          couponMessage = 'Coupon Already Exist"';
          res.redirect("/admin/add-coupones");
        } else {
          couponMessage = "Coupon Added succesfully";
          res.redirect("/admin/add-coupones");
        }
      });
    } catch (error) {res.render('error',error)}
  },
  deleteCoupons: (req, res) => {
    try {
      adminHelper.removeCoupons(req.params.id).then((response) => {
        res.json({response})
      });
    } catch (error) {res.render('error',error)}
  },

  salesReport: async (req, res) => {
    try {
      const dashActive = "active";
      const { start, end } = req.query;
      const query = {};
      query.orderStatus = "Delivered";
      if (start || end) {
        query.date = {};

        if (start) {
          query.date.$gte = new Date(start);
        }
        if (end) {
          query.date.$lte = new Date(end);
        }
      }
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
      res.render("admin/salesReport", { salesReport ,dashActive});
    } catch (error) {res.render('error',error)}
  },

  graphStatics: async (req, res) => {
    try {
      let OrderStatistics = await adminHelper.getOrdrStatistics() 
      let saleStatistics = await adminHelper.getSaleStatistics();
      let categortStatics = await adminHelper.getcategortStatics();
      let totalRevenue = await adminHelper.getTotalRevenue() 
      let totalOrders = await adminHelper.getTotalOrders();
      let totalProducts = await adminHelper.getTotalproducts();
      let totalProductsResult= totalProducts.length  
      res.json({
        OrderStatistics,
        saleStatistics,
        categortStatics,
        totalProductsResult,
        totalRevenue,
        totalOrders,
      });
    } catch (error) {res.render('error',error)}
  },

  graphStaticsDate: async (req, res) => {
    try {
      let year = req.query.year;
      let saleStatisticsDate = await adminHelper.getSaleStatisticsDate(year);
      res.json({ saleStatisticsDate });
    } catch (error) {res.render('error',error)}
  },

  graphStaticsCategory: async (req, res) => {
    try {
      let category = req.query.FilterCategory;

      let OrderStatisticsCategory = await adminHelper.getSaleStatisticsCategory(
        category
      );
      res.json({ OrderStatisticsCategory });
    } catch (error) {res.render('error',error)}
  },

  adminLogOut: (req, res) => {
    try {
      req.session.adminLoggedIn = false;
      res.redirect("/admin");
    } catch (error) {res.render('error',error)}
  },
};
