


const MongoClient=require('mongodb').MongoClient
const state={
    db:null
}

module.exports.connect=function(done){
    const url=process.env.MONGODB_URL
    const dbname='Gadgets'

    MongoClient.connect(url,(err,data)=>{
        if(err) return done(err)
        state.db=data.db(dbname)
        done()
    })
}

module.exports.get=function(){
    return state.db;
}
// const mongoose=require('mongoose')

// module.exports.connect = async () => {
//     try {
//       const connectionLink = await mongoose.connect("mongodb+srv://alangomez0047:Alan123@cluster0.nfyn1iq.mongodb.net/test", {
//         useUnifiedTopology: true,
//         useNewUrlParser: true,
//       })
//       console.log(`Mongodb connected: ${connectionLink.connection.host}`)
//     } catch (error) {
//       console.log(error.message)
//       process.exit(1)
//     }
// }



