const db = require("../config/connection");
var collection = require("../config/collection");
const { Collection, ObjectID } = require("mongodb");
// const { any } = require("../utils/multer");
// const { response } = require("../app");
var objectId = require("mongodb").ObjectID;

module.exports = {
  addTOCart: (proID, userId) => {
    let proObj = {
      item: objectId(proID),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let CartExist = await db
        .get()
        .collection(collection.CART_MANAGEMENT)
        .findOne({ user: objectId(userId) });
      if (CartExist) {
        let proExist = CartExist.products.findIndex(
          (product) => product.item == proID
        );

        if (proExist != -1) {
          db.get()
            .collection(collection.CART_MANAGEMENT)
            .updateOne(
              { "products.item": objectId(proID) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collection.CART_MANAGEMENT)
            .updateOne(
              { user: objectId(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve();
            });
        }
      } else {
        let cartObj = {
          user: objectId(userId),
          products: [proObj],
        };
        db.get()
          .collection(collection.CART_MANAGEMENT)
          .insertOne(cartObj)
          .then((response) => {
            resolve();
          });
      }
    });
  },
  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_MANAGEMENT)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_INFORMATION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      resolve(cartItems);
    });
  },
  getCategory: (catId,skip,limit) => {
    return new Promise(async (resolve, reject) => {
      let categoryDetails = await db
        .get()
        .collection(collection.PRODUCT_INFORMATION)
        .aggregate([
          {
            $match: { pro_cat: objectId(catId) ,stockStatus: { $eq: true } },
          },
          {
            $lookup: {
              from: collection.CATEGORIES,
              localField: "pro_cat",
              foreignField: "_id",
              as: "categoryDetails",
            },
          },
        ]).skip(skip).limit(limit)
        .toArray();
      resolve(categoryDetails);
    });
  },

  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count;
      let cart = await db
        .get()
        .collection(collection.CART_MANAGEMENT)
        .findOne({ user: objectId(userId) });
      if (cart) {
        count = cart.products.length;
      }
      resolve(count);
    });
  },
  changeQunatity: (cartDetails) => {
    cartDetails.count = parseInt(cartDetails.count);
    cartDetails.quantity = parseInt(cartDetails.quantity);

    return new Promise((resolve, reject) => {
      if (cartDetails.count == -1 && cartDetails.quantity == 1) {
        db.get()
          .collection(collection.CART_MANAGEMENT)
          .updateOne(
            { _id: objectId(cartDetails.cart) },
            {
              $pull: {
                products: { item: objectId(cartDetails.product) },
              },
            }
          )
          .then((response) => {
            resolve({ productRemoved: true });
          });
      } else {
        db.get()
          .collection(collection.CART_MANAGEMENT)
          .updateOne(
            {
              _id: objectId(cartDetails.cart),
              "products.item": objectId(cartDetails.product),
            },
            {
              $inc: { "products.$.quantity": cartDetails.count },
            }
          )
          .then((response) => {
            resolve({ status: true });
          });
      }
    });
  },

  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.CART_MANAGEMENT)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_INFORMATION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: { $multiply: ["$quantity", "$product.pro_price"] },
              },
            },
          },
        ])
        .toArray();
      resolve(total[0]);
    });
  },

  getCartProductList: (userId) => {
    return new Promise((resolve, reject) => {
      let product = db
        .get()
        .collection(collection.CART_MANAGEMENT)
        .findOne({ user: objectId(userId) });
      resolve(product);
    });
  },
  removeCartproduct: (cartDetails) => {
    cartId = cartDetails.cart;
    proId = cartDetails.product;
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_MANAGEMENT)
        .updateOne(
          { _id: objectId(cartId) },
          {
            $pull: {
              products: {
                item: objectId(proId),
              },
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },

  checkOut: (userId, order, product, total, address) => {
    // let proId = product.products[0].item;
    // let proCount = product.products[0].quantity;
    return new Promise((resolve, reject) => {
      let status;
      if (
        order["payment-method"] === "COD" ||
        order["payment-method"] === "wallet"
      ) {
        status = "placed";
      } else {
        status = "paymentFailed";
      }
      let orderObj = {
        deliveryDetails: {
          name: address.name,
          phone: address.phone,
          pincode: address.pincode,
          area: address.area,
          district: address.district,
          locality: address.locality,
        },
        userId: objectId(userId),
        products: product,
        paymentMethod: order["payment-method"],
        orderStatus: status,
        total: total,
        date: new Date(),
      };
      db.get()
        .collection(collection.ORDER_INFORMATION)
        .insertOne(orderObj)
        .then((response) => {
          if (status != "paymentFailed") {
            db.get()
              .collection(collection.CART_MANAGEMENT)
              .deleteOne({ user: objectId(userId) });
            product.products.forEach(items => {
              db.get()
              .collection(collection.PRODUCT_INFORMATION)
              .updateOne(
                { _id: objectId(items.item) },
                {
                  $inc: { pro_count: -items.quantity },
                }
              );         
            });
          }


          if (order["payment-method"] == "wallet") {
            db.get()
              .collection(collection.USER_INFORMATION)
              .updateOne(
                { _id: objectId(userId) },
                {
                  $inc: {
                    walletAmount: -total,
                  },
                }
              );
          }

          // if (order["payment-method"] == "wallet") {
          //   db.get()
          //     .collection(collection.USER_INFORMATION)
          //     .updateOne(
          //       { _id: objectId(userId) },
          //       {
          //         $inc: { walletAmount: -total },
          //       }
          //     );
          // }

          resolve(response.insertedId);
        });
    });
  },
  getOrderDetails: (userId) => {
    return new Promise(async (resolve, reject) => {
      let orderDetails = await db
        .get()
        .collection(collection.ORDER_INFORMATION)
        .find({ userId: objectId(userId) })
        .sort({ date: -1 })
        .toArray();
      resolve(orderDetails);
    });
  },
  getOrderProduct: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderProduct = await db
        .get()
        .collection(collection.ORDER_INFORMATION)
        .aggregate([
          {
            $match: { _id: objectId(orderId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.products.item",
              quantity: "$products.products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_INFORMATION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      resolve(orderProduct);
    });
  },
  addTowishlist: (proId, userId) => {
    let proObj = {
      item: objectId(proId),
    };
    return new Promise(async (resolve, reject) => {
      let wishlistExist = await db
        .get()
        .collection(collection.WISHLIST_MANAGEMENT)
        .findOne({ user: objectId(userId) });
      if (wishlistExist) {
        let proExist = wishlistExist.products.findIndex(
          (products) => products.item == proId
        );
        if (proExist === -1) {
          db.get()
            .collection(collection.WISHLIST_MANAGEMENT)
            .updateOne(
              { user: objectId(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve();
            });
        }
      } else {
        let wishlistObj = {
          user: objectId(userId),
          products: [proObj],
        };
        db.get()
          .collection(collection.WISHLIST_MANAGEMENT)
          .insertOne(wishlistObj)
          .then((response) => {
            resolve();
          });
      }
    });
  },

  removeWishlistProduct: (wishlistDetails, userId) => {
    proId = wishlistDetails.product;
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.WISHLIST_MANAGEMENT)
        .updateOne(
          { user: objectId(userId) },
          {
            $pull: {
              products: {
                item: objectId(proId),
              },
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },

  getWishlistProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let wishlistItems = await db
        .get()
        .collection(collection.WISHLIST_MANAGEMENT)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_INFORMATION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();

      resolve(wishlistItems);
    });
  },

  getCoupons: (userId) => {
    return new Promise(async (resolve, reject) => {
      let coupons = await db
        .get()
        .collection(collection.COUPONE_MANAGEMENT)
        .find(           
            // { usedUsers: { $elemMatch: {$ne: { user: objectId(userId) } } } },                             
        )
        .toArray();
      resolve(coupons);
    });
  },

  search: (query, sortObj, skip, limit) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_INFORMATION)
        .find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .toArray();
      resolve(products);
    });
  },

  getUserBannerInfo: () => {
    return new Promise(async (resolve, reject) => {
      let banner = await db
        .get()
        .collection(collection.BANNERS)
        .find()
        .toArray();
      resolve(banner);
    });
  },
};
