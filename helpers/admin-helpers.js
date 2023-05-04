
const db = require('../config/connection')
var collection = require('../config/collection');
const { Collection, ObjectID } = require('mongodb');
var objectId = require('mongodb').ObjectID
const bcrypt = require('bcryptjs');
const { response } = require('express');





module.exports = {



    adminDoLogin: (adminData) => {
        return new Promise(async (res, rej) => {
            let loginStatus = false
            let response = {}
            let admin = await db.get().collection(collection.ADMIN_INFORMATION).findOne({ admin_email: adminData.email })
            console.log(admin, '_________________________________________');
            if (admin) {
                if (admin.admin_email === adminData.email && admin.admin_pass === adminData.password) {
                    console.log('success');
                    response.status = true
                    res(response)
                } else {
                    console.log('no user available');

                    res({ status: false })

                }

            } else {
                console.log('no user available');
                res({ status: false })

            }


        })

    },



    addCategory: (categoryData) => {
        console.log(categoryData.category);
        categoryData.productStatus = true

        return new Promise((resolve, reject) => {

            db.get().collection(collection.CATEGORIES).findOne({ category: categoryData.category }).then((findCategory) => {

                console.log(findCategory);
                if (findCategory) {
                    resolve(true)
                } else {
                    db.get().collection(collection.CATEGORIES).insertOne(categoryData).then((response) => {
                        resolve(false)
                    })

                }
                //     db.get().collection(collection.CATEGORIES).insertOne(categoryData).then((response) => {
                //         resolve(response)
            })

        })



    },editCategory: (categoryId) => {
        

        return new Promise(async (resolve, reject) => {

           let category= await db.get().collection(collection.CATEGORIES).findOne({ _id:objectId(categoryId) })

           resolve(category)
        })
    },editCategoryPost: (categoryId,categoryData) => {
     

        return new Promise(async (resolve, reject) => {

          let findCategory= await  db.get().collection(collection.CATEGORIES).findOne({ category: categoryData.category })

                console.log(findCategory);
                if (findCategory) {
                    resolve(true)
                } else {
                    db.get().collection(collection.CATEGORIES).updateOne({_id:objectId(categoryId)},{

                        $set:{
                            category:categoryData.category
                        }
                    }).then((response) => {
                        resolve(false)
                    })

                }
                //     db.get().collection(collection.CATEGORIES).insertOne(categoryData).then((response) => {
                //         resolve(response)
           

        })



    },

    viewAllCategories: () => {
        return new Promise(async (resolve, reject) => {
            category = await db.get().collection(collection.CATEGORIES).find().toArray()
            resolve(category)

        })

    },

    addProduct: (productData, callback) => {
        // return new Promise(async (res, rej) => { 
        // productData.pro_cat=objectId(pro_cat)
        productData.stockStatus = true
        productData.pro_price = parseInt(productData.pro_price)
        productData.pro_count = parseInt(productData.pro_count)


        let catObj = productData.pro_cat
        productData.pro_cat = objectId(catObj)

        db.get().collection(collection.PRODUCT_INFORMATION).insertOne(productData).then((data) => {
            console.log(data);
            callback(data.insertedId)

        })
        // })
    },
    addProductImages: (proId, imgUrl) => {
        return new Promise(async (resolve, reject) => {
            console.log(imgUrl);
            db.get().collection(collection.PRODUCT_INFORMATION)
                .updateOne({ _id: new objectId(proId) },
                    {
                        $set:
                        {
                            image: imgUrl
                        }
                    }).then((data) => {
                        resolve(data);
                    })
        })
    },

    getProductInfo: () => {
        return new Promise(async (res, rej) => {
            // let products = await db.get().collection(collection.PRODUCT_INFORMATION).find().toArray()
            // res(products)


            let products = await db.get().collection(collection.PRODUCT_INFORMATION).aggregate([

                {
                    $lookup:
                    {
                        from: collection.CATEGORIES,
                        localField: "pro_cat",
                        foreignField: "_id",
                        as: "categoryDetails"
                    }
                }
            ]).toArray()
            res(products)

        })
    },




    editProduct: (proId, productdetails) => {
        let catObj = productdetails.pro_cat
        productdetails.pro_cat = objectId(catObj)
        productdetails.pro_price = parseInt(productdetails.pro_price)
        productdetails.pro_count = parseInt(productdetails.pro_count)



        return new Promise((res, rej) => {
            db.get().collection(collection.PRODUCT_INFORMATION).updateOne({ _id: objectId(proId) },
                {
                    $set: {
                        pro_name: productdetails.pro_name,
                        pro_desc: productdetails.pro_desc,
                        pro_price: productdetails.pro_price,
                        pro_cat: productdetails.pro_cat,
                        pro_count: productdetails.pro_count,

                        // image: productdetails.image,

                        // password: productdetails.password
                    }
                }).then((response) => {
                    res(response)
                })
        })

    },
    getOneProduct: (proId) => {
        console.log(proId);
        return new Promise((res,
        ) => {
            db.get().collection(collection.PRODUCT_INFORMATION).findOne({ _id: objectId(proId) }).then((product) => {
                console.log(product);
                res(product)
            })
        })
    },
    deleteProduct: (proId) => {
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_INFORMATION).updateOne({ _id: objectId(proId) },
            {
                $set: {
                    stockStatus: false
                }
            }).then((response) => {
                resolve()
            })

        })

      
            

    },

    getUserInfo: () => {
        return new Promise(async (res, rej) => {
            let users = await db.get().collection(collection.USER_INFORMATION).find().toArray()
            console.log(users);
            res(users)
        })
    },
    blockUser: (objId) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_INFORMATION).updateOne({ _id: objectId(objId) },
                {
                    $set: {
                        userstatus: false
                    }
                }).then((response) => {
                    resolve()
                })

        })
    },
    unblockUser: (objId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_INFORMATION).updateOne({ _id: objectId(objId) },
                {
                    $set: {
                        userstatus: true
                    }
                }).then((response) => {
                    resolve()
                })

        })
    },
    listCategory: (objId) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORIES).updateOne({ _id: objectId(objId) },
                {
                    $set: {
                        productStatus: false
                    }
                }).then((response) => {
                    resolve()
                })

        })
    },
    unListCategory: (objId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORIES).updateOne({ _id: objectId(objId) },
                {
                    $set: {
                        productStatus: true
                    }
                }).then((response) => {
                    resolve()
                })

        })
    },
    addBanner: (bannerData, callback) => {


        db.get().collection(collection.BANNERS).insertOne(bannerData).then((data) => {
            console.log(data);
            callback(data.insertedId)

        })
        // })
    },
    addBannerImages: (id, imgUrl) => {
        return new Promise(async (resolve, reject) => {
            console.log(imgUrl);
            db.get().collection(collection.BANNERS)
                .updateOne({ _id: new objectId(id) },
                    {
                        $set:
                        {
                            image: imgUrl
                        }
                    }).then((data) => {
                        resolve(data);
                    })
        })
    },
    getBannerInfo: () => {
        return new Promise(async (resolve, reject) => {
          let banner= await db.get().collection(collection.BANNERS).find().toArray()
          resolve(banner)
        })
    }, removeBanner: (bannerId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BANNERS).deleteOne({ _id: objectId(bannerId) }).then((response) => {
                resolve(response)
            })

        })

    },


    addUsers: (userData) => {
        return new Promise(async (res, rej) => {
            userData.password = await bcrypt.hash(userData.password, 10)
            db.get().collection(collection.USER).insertOne(userData).then((data) => {
                console.log(data);
                res(data.insertedId)

            })
        })
    },

    getAllUsers: () => {
        return new Promise(async (res, rej) => {
            let users = await db.get().collection(collection.USER).find().toArray()
            res(users)
        })
    },
    deleteUser: (userID) => {
        return new Promise((res, rej) => {
            db.get().collection(collection.USER).deleteOne({ _id: ObjectID(userID) }).then((response) => {
                res(response)

            })

        })

    },
    getUser: (userID) => {
        console.log(userID);
        return new Promise((res,
        ) => {
            db.get().collection(collection.USER).findOne({ _id: objectId(userID) }).then((user) => {
                res(user)
            })
        })
    },
    editUser: (userID, userDetails) => {
        console.log(userDetails.name)

        return new Promise((res, rej) => {
            db.get().collection(collection.USER).updateOne({ _id: objectId(userID) },
                {
                    $set: {
                        name: userDetails.name,
                        email: userDetails.email,
                        // password: userDetails.password
                    }
                }).then((response) => {
                    res(response)
                })
        })

    },
    getoderInfo: () => {
        // const skip = (page - 1) * pageSize;
        // const limit = pageSize;

        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_INFORMATION).find().toArray();
            resolve(orders)
        })

    },
    getTotalProducts: () => {
        return new Promise(async (resolve, reject) => {
            let count = await db.get().collection(collection.ORDER_INFORMATION).countDocuments()
            resolve(count)
        })

    },
    addCoupones: (couponeDetails) => {

        couponeDetails.coupone_maxPrice = parseInt(couponeDetails.coupone_maxPrice)
        couponeDetails.coupone_discount = parseInt(couponeDetails.coupone_discount)

        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPONE_MANAGEMENT).findOne({ coupone_code: couponeDetails.coupone_code }).then((findCategory) => {

                console.log(findCategory);
                if (findCategory) {
                    resolve(true)
                } else {
                    db.get().collection(collection.COUPONE_MANAGEMENT).insertOne(couponeDetails).then(() => {
                        resolve(false)
                    })

                }

            })










        })
    }
    , getCoponesInfo: () => {
        return new Promise(async (resolve, reject) => {
            let coupones = await db.get().collection(collection.COUPONE_MANAGEMENT).find().toArray()
            resolve(coupones)
        })

    }, removeCoupons: (couponID) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPONE_MANAGEMENT).deleteOne({ _id: objectId(couponID) }).then((response) => {
                resolve(response)
            })

        })

    },



    viewSingleOrder: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderDetails = await db.get().collection(collection.ORDER_INFORMATION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                }, {

                    $lookup: {
                        from: collection.USER_INFORMATION,
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'userDetails'

                    }
                }, {

                    $lookup: {
                        from: collection.PRODUCT_INFORMATION,
                        localField: 'products.products.item',
                        foreignField: '_id',
                        as: 'productDetails'

                    }
                },


            ]).toArray()


            resolve(orderDetails[0])

        })

    },
    changeStatus: (orderStatus) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_INFORMATION).updateOne({ _id: objectId(orderStatus.orderId) },
                {
                    $set: {
                        orderStatus: orderStatus.status
                    }
                }).then((response) => {
                    resolve(response)
                })

        })

    }, getSalesReport: (query) => {
        return new Promise(async (resolve, reject) => {
            let salesReport = await db.get().collection(collection.ORDER_INFORMATION).find(query).toArray()
           
            resolve(salesReport)
        })
    }, getOrdrStatistics: () => {
        return new Promise(async (resolve, reject) => {
            let ordrStatistics = await db.get().collection(collection.ORDER_INFORMATION).aggregate([
                {
                    $group: {
                        _id: "$orderStatus",
                        count: { $sum: 1 },
                        //   ids: { $push: "$orderStatus" } 
                    }

                }




            ]).toArray()
            // console.log(ordrStatistics, 'iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii');
            resolve(ordrStatistics)

        })


    }
    , getSaleStatistics: () => {

        return new Promise(async (resolve, reject) => {
            let saleStatistics = await db.get().collection(collection.ORDER_INFORMATION).aggregate([
                {
                    $match: {
                        $expr: {
                            $eq: [{ $year: "$date" }, 2023] // Replace 2023 with the desired year
                        }
                    }
                },
                {
                    $match:{
                        orderStatus:'Delivered'

                    }
                },
                {
                    $group: {
                        _id: { $month: "$date" }, // Group by month of the "date" field
                        totalAmount: { $sum: "$total" } // Calculate the sum of the "amount" field
                    }
                }, { $sort: { date: 1 } },

            ]).toArray()
            // console.log(saleStatistics, 'iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii');
            resolve(saleStatistics)

        })


    }, getcategortStatics: () => {
        return new Promise(async (resolve, reject) => {
            let categoryStatistics = await db.get().collection(collection.PRODUCT_INFORMATION).aggregate([
                {


                    $lookup: {
                        from: collection.CATEGORIES,
                        localField: 'pro_cat',
                        foreignField: '_id',
                        as: 'categoryDetails'

                    }
                },

                {

                    $group: {
                        _id: "$categoryDetails.category",
                        count: { $sum: 1 },
                        //   ids: { $push: "$orderStatus" } 
                    }

                }
            ]).toArray()
            // console.log(categoryStatistics, 'cateiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii');
            resolve(categoryStatistics)

        })
    }, getTotalRevenue: () => {
        return new Promise(async (resolve, reject) => {
            let totalRevenue = await db.get().collection(collection.ORDER_INFORMATION).aggregate([
                {

                    $group: {
                        _id: null,
                        count: { $sum: { $multiply: '$total' } },
                        //   ids: { $push: "$orderStatus" } 
                    }


                }
            ]).toArray()
            // console.log(totalRevenue[0], ',,,,,,,,,,,,,,revenue');
            resolve(totalRevenue[0])

        })
    },getTotalOrders: () => {
        return new Promise(async (resolve, reject) => {
            let totalOrders = await db.get().collection(collection.ORDER_INFORMATION).aggregate([
               
                {
                    $group: {
                      _id: null,
                      count: {
                        $sum: 1
                      }
                    }
                  }
        
            ]).toArray()
            console.log(totalOrders[0], ',,,,,,,,,,,,,,toatl orders');
            resolve(totalOrders[0])



        })
    },getTotalproducts: () => {
        return new Promise(async (resolve, reject) => {
            let totalProducts = await db.get().collection(collection.PRODUCT_INFORMATION).find().count()
            // console.log(totalProducts, ',,,,,,,,,,,,,,revenue');
            resolve(totalProducts)



        })
    },getSaleStatisticsDate: (yeardata) => {
        let year=parseInt(yeardata)

        return new Promise(async (resolve, reject) => {
            let saleStatisticsDate = await db.get().collection(collection.ORDER_INFORMATION).aggregate([
                {
                    $match: {
                        $expr: {
                            $eq: [{ $year: "$date" }, year] // Replace 2023 with the desired year
                        }
                    }
                },
                {
                    $match:{
                        orderStatus:'Delivered'

                    }
                },
                {
                    $group: {
                        _id: { $month: "$date" }, // Group by month of the "date" field
                        totalAmount: { $sum: "$total" } ,// Calculate the sum of the "amount" field
                        
                    
                    }
                }, { $sort: { date: 1 } },

            ]).toArray()
            // console.log(saleStatisticsDate, 'filter::::::iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii');
            resolve(saleStatisticsDate)

        })


    },

}