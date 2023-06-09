const db = require("../config/connection");
var collection = require("../config/collection");
const { Collection, ObjectID } = require("mongodb");
var objectId = require("mongodb").ObjectID;
const bcrypt = require("bcryptjs");
const { response } = require("express");
const slug = require('slug');

module.exports = {
  adminDoLogin: (adminData) => {
    return new Promise(async (res, rej) => {
      try {
        let response = {};
        let admin = await db
          .get()
          .collection(collection.ADMIN_INFORMATION)
          .findOne({ admin_email: adminData.email });
        if (admin) {
          if (
            admin.admin_email === adminData.email &&
            admin.admin_pass === adminData.password
          ) {
            response.status = true;
            res(response);
          } else {
            rej({ status: false });
          }
        } else {
          rej({ status: false });
        }
      } catch (error) {}
    });
  },

  addCategory: (categoryData) => {
    categoryData.productStatus = true;
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORIES)
        .findOne({ category: categoryData.category })
        .then((findCategory) => {
          if (findCategory) {
            resolve(true);
          } else {
            db.get()
              .collection(collection.CATEGORIES)
              .insertOne(categoryData)
              .then((response) => {
                resolve(false);
              });
          }
        });
    });
  },
  editCategory: (categoryId) => {
    return new Promise(async (resolve, reject) => {
      let category = await db
        .get()
        .collection(collection.CATEGORIES)
        .findOne({ _id: objectId(categoryId) });

      resolve(category);
    });
  },
  editCategoryPost: (categoryId, categoryData) => {
    return new Promise(async (resolve, reject) => {
      let findCategory = await db
        .get()
        .collection(collection.CATEGORIES)
        .findOne({ category: categoryData.category });
      if (findCategory) {
        resolve(true);
      } else {
        db.get()
          .collection(collection.CATEGORIES)
          .updateOne(
            { _id: objectId(categoryId) },
            {
              $set: {
                category: categoryData.category,
              },
            }
          )
          .then((response) => {
            resolve(false);
          });
      }
    });
  },

  viewAllCategories: () => {
    return new Promise(async (resolve, reject) => {
      category = await db
        .get()
        .collection(collection.CATEGORIES)
        .find()
        .toArray();
      resolve(category);
    });
  },

  addProduct: (productData, callback) => {
    // return new Promise(async (res, rej) => {
    let slugifiedTitle = slug(productData.pro_name);
    productData.slugName=slugifiedTitle
    productData.stockStatus = true;
    productData.pro_price = parseInt(productData.pro_price);
    productData.pro_count = parseInt(productData.pro_count);
    let catObj = productData.pro_cat;
    productData.pro_cat = objectId(catObj);
    db.get()
      .collection(collection.PRODUCT_INFORMATION)
      .insertOne(productData)
      .then((data) => {
        callback(data.insertedId);
      });
    // })
  },

  addProductImages: (proId, imgUrl) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_INFORMATION)
        .updateOne(
          { _id: new objectId(proId) },
          {
            $set: {
              image: imgUrl,
            },
          }
        )
        .then((data) => {
          resolve(data);
        });
    });
  },

  getProductInfoAdmin: () => {
    return new Promise(async (res, rej) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_INFORMATION)
        .aggregate([
          {
            $lookup: {
              from: collection.CATEGORIES,
              localField: "pro_cat",
              foreignField: "_id",
              as: "categoryDetails",
            },
          },
        ])
        .toArray();
      res(products);
    });
  },

  getProductInfo: (skip, limit) => {
    return new Promise(async (res, rej) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_INFORMATION)
        .aggregate([
          { $match: { stockStatus: { $eq: true } } },
          {
            $lookup: {
              from: collection.CATEGORIES,
              localField: "pro_cat",
              foreignField: "_id",
              as: "categoryDetails",
            },
          },
        ])
        .skip(skip)
        .limit(limit)
        .toArray();
      res(products);
    });
  },

  editProduct: (proId, productdetails) => {
    let catObj = productdetails.pro_cat;
    productdetails.pro_cat = objectId(catObj);
    productdetails.pro_price = parseInt(productdetails.pro_price);
    productdetails.pro_count = parseInt(productdetails.pro_count);

    return new Promise((res, rej) => {
      db.get()
        .collection(collection.PRODUCT_INFORMATION)
        .updateOne(
          { _id: objectId(proId) },
          {
            $set: {
              pro_name: productdetails.pro_name,
              pro_desc: productdetails.pro_desc,
              pro_price: productdetails.pro_price,
              pro_cat: productdetails.pro_cat,
              pro_count: productdetails.pro_count,
            },
          }
        )
        .then((response) => {
          res(response);
        });
    });
  },
  getOneProduct: (proId) => {
    return new Promise((res) => {
      db.get()
        .collection(collection.PRODUCT_INFORMATION)
        .findOne({ slugName:proId })
        .then((product) => {
          res(product);
        });
    });
  },
  deleteProduct: (proId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_INFORMATION)
        .updateOne(
          { _id: objectId(proId) },
          {
            $set: {
              stockStatus: false,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },

  getUserInfo: () => {
    return new Promise(async (res, rej) => {
      let users = await db
        .get()
        .collection(collection.USER_INFORMATION)
        .find()
        .toArray();
      res(users);
    });
  },

  blockUser: (objId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_INFORMATION)
        .updateOne(
          { _id: objectId(objId) },
          {
            $set: {
              userstatus: false,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  unblockUser: (objId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_INFORMATION)
        .updateOne(
          { _id: objectId(objId) },
          {
            $set: {
              userstatus: true,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  listCategory: (objId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORIES)
        .updateOne(
          { _id: objectId(objId) },
          {
            $set: {
              productStatus: false,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  unListCategory: (objId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORIES)
        .updateOne(
          { _id: objectId(objId) },
          {
            $set: {
              productStatus: true,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  addBanner: (bannerData, callback) => {
    db.get()
      .collection(collection.BANNERS)
      .insertOne(bannerData)
      .then((data) => {
        callback(data.insertedId);
      });
  },
  addBannerImages: (id, imgUrl) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.BANNERS)
        .updateOne(
          { _id: new objectId(id) },
          {
            $set: {
              image: imgUrl,
            },
          }
        )
        .then((data) => {
          resolve(data);
        });
    });
  },
  getBannerInfo: () => {
    return new Promise(async (resolve, reject) => {
      let banner = await db
        .get()
        .collection(collection.BANNERS)
        .find()
        .toArray();
      resolve(banner);
    });
  },
  removeBanner: (bannerId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.BANNERS)
        .deleteOne({ _id: objectId(bannerId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  getoderInfo: () => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_INFORMATION)
        .find()
        .toArray();
      resolve(orders);
    });
  },
  getTotalProducts: () => {
    return new Promise(async (resolve, reject) => {
      let count = await db
        .get()
        .collection(collection.ORDER_INFORMATION)
        .countDocuments();
      resolve(count);
    });
  },

  addCoupones: (couponeDetails) => {
    couponeDetails.coupone_maxPrice = parseInt(couponeDetails.coupone_maxPrice);
    couponeDetails.coupone_discount = parseInt(couponeDetails.coupone_discount);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.COUPONE_MANAGEMENT)
        .findOne({ coupone_code: couponeDetails.coupone_code })
        .then((findCoupon) => {
          if (findCoupon) {
            resolve(true);
          } else {
            db.get()
              .collection(collection.COUPONE_MANAGEMENT)
              .insertOne(couponeDetails)
              .then(() => {
                resolve(false);
              });
          }
        });
    });
  },

  getCoponesInfo: () => {
    return new Promise(async (resolve, reject) => {
      let coupones = await db
        .get()
        .collection(collection.COUPONE_MANAGEMENT)
        .find()
        .toArray();
      resolve(coupones);
    });
  },

  removeCoupons: (couponID) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.COUPONE_MANAGEMENT)
        .deleteOne({ _id: objectId(couponID) })
        .then((response) => {
          resolve(response);
        });
    });
  },

  viewSingleOrder: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderDetails = await db
        .get()
        .collection(collection.ORDER_INFORMATION)
        .aggregate([
          {
            $match: { _id: objectId(orderId) },
          },
          {
            $lookup: {
              from: collection.USER_INFORMATION,
              localField: "userId",
              foreignField: "_id",
              as: "userDetails",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_INFORMATION,
              localField: "products.products.item",
              foreignField: "_id",
              as: "productDetails",
            },
          },
        ])
        .toArray();
      resolve(orderDetails[0]);
    });
  },

  changeStatus: (orderStatus) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_INFORMATION)
        .updateOne(
          { _id: objectId(orderStatus.orderId) },
          {
            $set: {
              orderStatus: orderStatus.status,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  getSalesReport: (query) => {
    return new Promise(async (resolve, reject) => {
      let salesReport = await db
        .get()
        .collection(collection.ORDER_INFORMATION)
        .find(query)
        .toArray();

      resolve(salesReport);
    });
  },
  getOrdrStatistics: () => {
    return new Promise(async (resolve, reject) => {
      let ordrStatistics = await db
        .get()
        .collection(collection.ORDER_INFORMATION)
        .aggregate([
          {
            $group: {
              _id: "$orderStatus",
              count: { $sum: 1 },
            },
          },
        ])
        .toArray();
      resolve(ordrStatistics);
    });
  },
  getSaleStatistics: () => {
    return new Promise(async (resolve, reject) => {
      let saleStatistics = await db
        .get()
        .collection(collection.ORDER_INFORMATION)
        .aggregate([
          {
            $match: {
              orderStatus: "Delivered",
            },
          },
          {
            $group: {
              _id: { $month: "$date" },
              totalAmount: { $sum: "$total" },
            },
          },
          { $sort: { date: 1 } },
        ])
        .toArray();
      resolve(saleStatistics);
    });
  },
  getcategortStatics: () => {
    return new Promise(async (resolve, reject) => {
      let categoryStatistics = await db
        .get()
        .collection(collection.PRODUCT_INFORMATION)
        .aggregate([
          {
            $lookup: {
              from: collection.CATEGORIES,
              localField: "pro_cat",
              foreignField: "_id",
              as: "categoryDetails",
            },
          },

          {
            $group: {
              _id: "$categoryDetails.category",
              count: { $sum: 1 },
            },
          },
        ])
        .toArray();
      resolve(categoryStatistics);
    });
  },
  getTotalRevenue: () => {
    return new Promise(async (resolve, reject) => {
      let totalRevenue = await db
        .get()
        .collection(collection.ORDER_INFORMATION)
        .aggregate([
          {
            $match: {
              orderStatus: "Delivered",
            },
          },
          {
            $group: {
              _id: null,
              count: { $sum: { $multiply: "$total" } },
            },
          },
        ])
        .toArray();
      resolve(totalRevenue[0]);
    });
  },

  getTotalOrders: () => {
    return new Promise(async (resolve, reject) => {
      let totalOrders = await db
        .get()
        .collection(collection.ORDER_INFORMATION)
        .aggregate([
          {
            $group: {
              _id: null,
              count: {
                $sum: 1,
              },
            },
          },
        ])
        .toArray();
      resolve(totalOrders[0]);
    });
  },
  getTotalproducts: () => {
    return new Promise(async (resolve, reject) => {
      let totalProducts = await db
        .get()
        .collection(collection.PRODUCT_INFORMATION)
        .find()
        .toArray();
      resolve(totalProducts);
    });
  },

  getSaleStatisticsDate: (yeardata) => {
    let year = parseInt(yeardata);
    return new Promise(async (resolve, reject) => {
      let saleStatisticsDate = await db
        .get()
        .collection(collection.ORDER_INFORMATION)
        .aggregate([
          {
            $match: {
              $expr: {
                $eq: [{ $year: "$date" }, year],
              },
            },
          },
          {
            $match: {
              orderStatus: "Delivered",
            },
          },
          {
            $group: {
              _id: { $month: "$date" },
              totalAmount: { $sum: "$total" },
            },
          },
          { $sort: { date: 1 } },
        ])
        .toArray();
      resolve(saleStatisticsDate);
    });
  },
  getSaleStatisticsCategory: (category) => {
    return new Promise(async (resolve, reject) => {
      let ordrstaticsCategory = await db
        .get()
        .collection(collection.ORDER_INFORMATION)
        .aggregate([
          {
            $unwind: "$products",
          },

          {
            $lookup: {
              from: collection.PRODUCT_INFORMATION,
              localField: "products.products.item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              catId: "$product.pro_cat",
            },
          },
          {
            $lookup: {
              from: collection.CATEGORIES,
              localField: "catId",
              foreignField: "_id",
              as: "cats",
            },
          },
          {
            $project: {
              catName: "$cats.category",
            },
          },
          {
            $unwind: "$catName",
          },
          {
            $match: {
              catName: category,
            },
          },

          {
            $group: {
              _id: "$catName",
              count: { $sum: 1 },
            },
          },
        ])
        .toArray();
      resolve(ordrstaticsCategory);
    });
  },
};
