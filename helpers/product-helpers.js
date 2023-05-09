const db = require("../config/connection");
var collection = require("../config/collection");
const { Collection, ObjectID } = require("mongodb");
const { any } = require("../utils/multer");
const { response } = require("../app");
var objectId = require("mongodb").ObjectID;

module.exports = {
  addTOCart: (proID, userId) => {
    let proObj = {
      item: objectId(proID),
      quantity: 1,
    };
    console.log(proID, proObj.item);
    return new Promise(async (resolve, reject) => {
      let CartExist = await db
        .get()
        .collection(collection.CART_MANAGEMENT)
        .findOne({ user: objectId(userId) });
      if (CartExist) {
        let proExist = CartExist.products.findIndex(
          (product) => product.item == proID
        );
        console.log(proExist);
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
      // console.log(cartItems[0].product);
      // console.log(cartItems);
      resolve(cartItems);
    });
  },
  getCategory: (catId) => {
    return new Promise(async (resolve, reject) => {
      let categoryDetails = await db
        .get()
        .collection(collection.PRODUCT_INFORMATION)
        .aggregate([
          {
            $match: { pro_cat: objectId(catId) },
          },
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
    // console.log(cartDetails);
    cartDetails.count = parseInt(cartDetails.count);
    cartDetails.quantity = parseInt(cartDetails.quantity);

    return new Promise((resolve, reject) => {
      if (cartDetails.count == -1 && cartDetails.quantity == 1) {
        console.log("if cheacked");
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
      console.log(total, "hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh");

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

    let proId = product.products[0].item;
    let proCount = product.products[0].quantity;

    // const items = product.map(product => product.item);

    return new Promise((resolve, reject) => {
      // let status = order["payment-method"] === "COD"  ? "placed" : "paymentFailed";
      let status
      if(order["payment-method"] === "COD" || ["payment-method"] === "wallet"){
        status="placed"
      }else{
        status="paymentFailed"
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

          if(status!='paymentFailed'){
            db.get()
            .collection(collection.CART_MANAGEMENT)
            .deleteOne({ user: objectId(userId) });
          db.get()
            .collection(collection.PRODUCT_INFORMATION)
            .updateOne(
              { _id: proId },
              {
                $inc: { pro_count: -proCount },
              }
            );

          }
          if(order["payment-method"]=="wallet"){
            db.get().collection(collection.USER_INFORMATION).updateOne({_id:objectId(userId)},{
              $inc:{
                walletAmount:-total
              }
            })
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
      console.log(userId, orderDetails, "............................");
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
            $match: { _id: objectId(orderId)},
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

      console.log(
        orderProduct,
        "000000000000000000000000000000000000000000000000"
      );
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
        console.log(proExist);
        if (proExist === -1) {
          //     db.get().collection(collection.WISHLIST_MANAGEMENT).updateOne({ 'products.item': objectId(proId) }
          //     ).then(() => {
          //         resolve()
          //     })
          // } else {
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

  removeWishlistProduct: (wishlistDetails,userId) => {
    
    proId = wishlistDetails.product;
    console.log(userId);
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
          console.log(response);
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

  // search: (details,page,pageSize) => {
  //     const skip = (page - 1) * pageSize;
  //     const limit = pageSize;
  //     return new Promise(async (resolve, reject) => {
  //         try {
  //             const searchValue = details.search;
  //             console.log(searchValue, 'uuuuuuuuuuuuuuuuuuuu');
  //             const products = await db.get().collection(collection.PRODUCT_INFORMATION)
  //                 .find({
  //                     'pro_name': { $regex: `.*${searchValue}.*`, $options: 'i' }
  //                 }).skip(skip).limit(limit).toArray();

  //             resolve(products);

  //             console.log(products, 'ooooooooooooooooooooooo');
  //         } catch (err) {
  //             reject(err);
  //         }
  //     })

  // },

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

  filterdSearch: (details, filter, page, pageSize) => {
    const skip = (page - 1) * pageSize;
    const limit = pageSize;
    return new Promise(async (resolve, reject) => {
      try {
        const searchValue = details.search;
        const filterValue = filter;
        console.log(
          searchValue,
          "this is search value......................................"
        );

        console.log(
          filterValue,
          "this is filter value......................................"
        );

        if (filterValue == "0-20000") {
          let products = await db
            .get()
            .collection(collection.PRODUCT_INFORMATION)
            .find({
              pro_name: { $regex: `.*${searchValue}.*`, $options: "i" },
              pro_price: { $gte: 0, $lte: 20000 },
            })
            .skip(skip)
            .limit(limit)
            .toArray();

          resolve(products);
        } else if (filterValue == "20000-40000") {
          let products = await db
            .get()
            .collection(collection.PRODUCT_INFORMATION)
            .find({
              pro_name: { $regex: `.*${searchValue}.*`, $options: "i" },
              pro_price: { $gte: 20000, $lte: 40000 },
            })
            .skip(skip)
            .limit(limit)
            .toArray();

          resolve(products);
        } else if (filterValue == "40000-80000") {
          let products = await db
            .get()
            .collection(collection.PRODUCT_INFORMATION)
            .find({
              pro_name: { $regex: `.*${searchValue}.*`, $options: "i" },
              pro_price: { $gte: 40000, $lte: 80000 },
            })
            .skip(skip)
            .limit(limit)
            .toArray();

          resolve(products);
        } else {
          let products = await db
            .get()
            .collection(collection.PRODUCT_INFORMATION)
            .find({
              pro_name: { $regex: `.*${searchValue}.*`, $options: "i" },
              pro_price: { $gte: 80000 },
            })
            .skip(skip)
            .limit(limit)
            .toArray();

          resolve(products);
        }
      } catch (err) {
        reject(err);
      }
    });
  },
  sortedProduct: (sort, page, pageSize) => {
    const skip = (page - 1) * pageSize;
    const limit = pageSize;

    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_INFORMATION)
        .find({ pro_name: { $regex: `.*${sort}.*`, $options: "i" } })
        .sort({ pro_price: 1 })
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
