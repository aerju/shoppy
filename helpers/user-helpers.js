const db = require("../config/connection");
var collection = require("../config/collection");
const bcrypt = require("bcryptjs");
// const Razorpay = require('razorpay');

const Razorpay = require("razorpay");
const { Collection, ObjectID } = require("mongodb");
const { response } = require("../app");

var objectId = require("mongodb").ObjectID;
// const productHelper = require('/helpers/product-helpers');

var instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = {
  doSignup: (userData) => {
    let response = {};
    return new Promise(async (res, rej) => {
      userData.phone = "+91" + userData.phone;

      let userExist = db
        .get()
        .collection(collection.USER_INFORMATION)
        .aggregate([
          {
            $match: {
              $or: [{ phone: userData.phone }, { email: userData.email }],
            },
          },
        ])
        .toArray();

      console.log(userExist, "kkkkkkkk");
      if (userExist.length > 0) {
        res({ userExitsStatus: true });
      } else {
        userData.password = await bcrypt.hash(userData.password, 10);
        userData.userstatus = true;
        db.get()
          .collection(collection.USER_INFORMATION)
          .insertOne(userData)
          .then((data) => {
            response.user = userData;
            response.user.id = data.insetedId;
            res(response);
          });
      }
    });
  },

  doLogin: (userData) => {
    return new Promise(async (res, rej) => {
      let loginStatus = false;
      let response = {};
      let user = await db
        .get()
        .collection(collection.USER_INFORMATION)
        .findOne({ email: userData.email });
      if (user.userstatus) {
        bcrypt.compare(userData.password, user.password).then((status) => {
          if (status) {
            console.log("success");
            response.user = user;
            response.status = true;
            res(response);
          } else {
            console.log("erorr login");
            res({ status: false });
          }
        });
      } else {
        console.log("no user available");
        res({ status: false });
      }
    });
  },
  updateProfileInfo: (userDetails, userId) => {
    return new Promise((reslove, reject) => {
      userDetails.phone = "+91" + userDetails.phone;
      db.get()
        .collection(collection.USER_INFORMATION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: {
              name: userDetails.name,
              email: userDetails.email,
              phone: userDetails.phone,
            },
          }
        )
        .then((response) => {
          reslove(response);
        });
    });
  },
  getUserDta: (userId) => {
    return new Promise(async (reslove, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_INFORMATION)
        .findOne({ _id: objectId(userId) });
      console.log(user, "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk");
      reslove(user);
    });
  },

  doOtplogin: (number) => {
    let response = {};
    return new Promise(async (resolve, reject) => {
      let getNumber = await db
        .get()
        .collection(collection.USER_INFORMATION)
        .findOne({ phone: number });
      if (getNumber) {
        response.status = true;
        resolve(getNumber);
      } else {
        response.status = false;
        resolve(getNumber);
      }
    });
  },
  updatePassword: (userId, pass) => {
    return new Promise(async (resolve, reject) => {
      pass = await bcrypt.hash(pass, 10);
      db.get()
        .collection(collection.USER_INFORMATION)
        .updateOne(
          { _id: userId },
          {
            $set: {
              password: pass,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },

  gererateRazopay: (orderId, total) => {
    console.log("razorpay is running");
    return new Promise((resolve, reject) => {
      var options = {
        amount: total * 100,
        currency: "INR",
        receipt: "" + orderId,
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log(err);
        } else {
          // console.log(order);
          resolve(order);
        }
      });
    });
  },
  verifyPayment: (orderDeatails) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");

      let hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
      hmac.update(
        orderDeatails["payment[razorpay_order_id]"] +
          "|" +
          orderDeatails["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");
      console.log(hmac, "======", orderDeatails["payment[razorpay_signature]"]);
      if (hmac === orderDeatails["payment[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    });
  },
  changePaymentStatus: (orderId, userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_INFORMATION)
        .updateOne(
          { _id: objectId(orderId) },

          {
            $set: {
              orderStatus: "placed",
            },
          }
        )
        .then(() => {
          db.get()
            .collection(collection.CART_MANAGEMENT)
            .deleteOne({ user: objectId(userId) });

          resolve();
        });
    });
  },
  addAddres: (addressDetails, userId) => {
    return new Promise((resolve, reject) => {
      let addressobj = {
        _id: new objectId(),
        name: addressDetails.name,
        phone: addressDetails.phone,
        pincode: addressDetails.pincode,
        area: addressDetails.area,
        district: addressDetails.district,
        locality: addressDetails.locality,
      };

      db.get()
        .collection(collection.USER_INFORMATION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $push: { address: addressobj },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  getAddressInfo: (userId) => {
    return new Promise(async (resolve, reject) => {
      let addAddresdetails = await db
        .get()
        .collection(collection.USER_INFORMATION)
        .findOne({ _id: objectId(userId) });
      // add = addAddresdetails.addAddres
      resolve(addAddresdetails);
    });
  },
  applyCoupone: (coupone, userId) => {
    return new Promise(async (resolve, reject) => {
      let checKCoupone = await db
        .get()
        .collection(collection.COUPONE_MANAGEMENT)
        .findOne({ coupone_code: coupone.couponeCode });
      usedUsers = [];
      if (checKCoupone) {
        let couponeId = checKCoupone._id;
        const couponeUsed = checKCoupone.usedUsers?.findIndex(
          (obj) => obj.user === objectId(userId)
        );

        let couponeDetails = await db
          .get()
          .collection(collection.COUPONE_MANAGEMENT)
          .find({ _id: objectId(couponeId) })
          .toArray();
        let date = new Date("2023-04-04");
        console.log(couponeDetails[0].coupone_date, date);

        if (couponeUsed) {
          console.log("Already used..................");
          let cp = {
            couponeStatus: false,
          };
          resolve(cp);
        } else if (couponeDetails[0].coupone_date < date) {
          console.log("expired.................");
          let cp = {
            couponeStatus: false,
          };
          resolve(cp);
        } else {
          db.get()
            .collection(collection.COUPONE_MANAGEMENT)
            .updateOne(
              { _id: objectId(couponeId) },
              {
                $push: {
                  usedUsers: { user: objectId(userId) },
                },
              }
            );
          let total = coupone.total - checKCoupone.coupone_maxPrice;
          let cp = {
            total,
            couponeStatus: true,
          };
          resolve(cp);
        }
      } else {
        console.log("Invalid coupone..................");
        let cp = {
          couponeStatus: false,
        };

        resolve(cp);
      }
    });
  },
  getOrderAddress: (address, userID) => {
    let addressId = objectId(address.addressDetails);
    let userId = objectId(userID);

    return new Promise(async (resolve, reject) => {
      const address = await db
        .get()
        .collection(collection.USER_INFORMATION)
        .findOne(
          {
            _id: userId,
            address: { $elemMatch: { _id: addressId } },
          },
          {
            projection: {
              _id: 0,
              "address.$": 1,
            },
          }
        );

      resolve(address.address[0]);
    });
  },
  deleteUserAddress: (addressDetails, userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_INFORMATION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $pull: {
              address: {
                _id: objectId(addressDetails.address),
              },
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  editUserAddress: (addressDetails, userId) => {
    return new Promise(async (resolve, reject) => {
      let address = await db
        .get()
        .collection(collection.USER_INFORMATION)
        .findOne(
          {
            _id: objectId(userId),
            address: { $elemMatch: { _id: objectId(addressDetails.address) } },
          },
          {
            projection: {
              _id: 0,
              "address.$": 1,
            },
          }
        );

      resolve(address);
    });
  },
  updateAddressInfo: (addressDetails, userId) => {
    return new Promise(async (resolve, reject) => {
      let addressObj = {
        _id: new objectId(),
        name: addressDetails.name,
        phone: addressDetails.phone,
        pincode: addressDetails.pin,
        area: addressDetails.area,
        district: addressDetails.district,
        locality: addressDetails.locality,
      };

      db.get()
        .collection(collection.USER_INFORMATION)
        .update(
          {
            address: {
              $elemMatch: { _id: objectId(addressDetails.addressId) },
            },
          },

          {
            $set: {
              "address.$.name": addressDetails.name,
              "address.$.phone": addressDetails.phone,
              " address.$.pincode": addressDetails.pin,
              " address.$.area": addressDetails.area,
              "address.$.district": addressDetails.district,
              "address.$.locality": addressDetails.locality,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },

  cancelOrderRequest: (orderDetails) => {
    return new Promise(async (resolve, reject) => {
        orderDetails.total=parseInt(orderDetails.total)
      db.get()
        .collection(collection.ORDER_INFORMATION)
        .updateOne(
          { _id: objectId(orderDetails.orderId) },
          {
            $set: {
              orderStatus: "cancelrequest",
            },
          }
        );
        if(orderDetails.paymentMethod=="razorpay"){
        db.get().collection(collection.USER_INFORMATION).updateOne({_id:objectId(orderDetails.userId)},
        {
            $inc: { walletAmount: orderDetails.total },
          }
        )


        }
    });
  },
  returnOrderRequest: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_INFORMATION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              orderStatus: "returnrequest",
            },
          }
        );
    });
  },

  getWalletInfo: (userId) => {
    return new Promise(async (resolve, reject) => {
      let wallet = await db
        .get()
        .collection(collection.USER_INFORMATION).findOne({_id:objectId(userId)})

      console.log(wallet, "rtt");
      resolve(wallet)

     
    });
  },
  getInvoiceInfo: (orderId) => {
    return new Promise((resolve, reject) => {
      let orderInfo = db.get().collection(collection.orderDeatails).toArray();
      resolve(orderInfo[0]);
    });
  },
};
