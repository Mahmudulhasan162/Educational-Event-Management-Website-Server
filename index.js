const express = require("express");
const cors = require('cors');
const jwt = require('jsonwebtoken')
const cookieParser= require('cookie-parser')
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.port || 5000;

//middleware
app.use(cors({
  origin: ['http://localhost:5173','https://educational-events-aaeb4.web.app'],
  credentials: true
}))
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tbshjw2.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const logger = async(req, res, next) => {
  console.log('Called: ', req.hostname, req.originalUrl);
  next();
}

const verifyToken = async(req, res, next) => {
  const token = req.cookies?.token;
  console.log(token);
  if(!token){
    return res.status(401).send({message : 'Not Authorized'})
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
    if(err){
      console.log(err);
      return res.status(401).send({message: 'unauthorized'})
    }
    console.log("value in the decoded: ", decoded);
    req.user = decoded
    next();
  })
}
async function run() {
  try {
    

    const serviceCollection = client.db("EventData").collection("services");
    const dataCollection = client.db('EventData').collection('allData');
    const cartProducts = client.db('EventData').collection('cart');

    // jwt related data
    app.post('/jwt',logger, async (req, res)=>{
      const user = req.body;
      console.log(user);
      const token = jwt.sign( user, process.env.ACCESS_TOKEN_SECRET , {expiresIn: '1h'})
      res
      .cookie('token', token, {
        httpOnly: true,
        secure: false
      })
      .send({success: true})
    })

    //service data
    app.get('/services',logger, async(req,res)=>{
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })
    
    //all service data
    app.get('/allData',logger, async(req,res)=>{
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      console.log('pagination: ',page, size);
      const SkipAmount = Math.max(page* size, 0); 
      console.log(SkipAmount);
      const cursor = dataCollection.find();
      const result = await cursor.skip(SkipAmount).limit(size).toArray();
      res.send(result);
    })

    app.get('/allData/:id', async(req, res)=>{
      const id= req.params.id
      const query= {_id: new ObjectId(id)}
      const option = {
        projection: {id: 1,short_description: 1, price: 1, service_name:1, image: 1 },
      };
      const result = await dataCollection.findOne(query, option);
      res.send(result)
    })

    //all cart data 
    app.post("/cart",logger, async(req, res)=>{
      const cart = req.body;
      console.log('Cart Email: ',cart.email,'Cart Id', cart._id);
      try{
        const existingCartItem = await cartProducts.findOne({userEmail: cart.email, productId: cart._id})
        console.log('Existing: ', existingCartItem);

        if(!existingCartItem){
          const result= await cartProducts.insertOne(cart);
        console.log("cart a add holam ami",result);
        }else{
            console.log("Already in your cart");
        }
      }catch(error){
        console.error('Error adding product to cart:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    })

    app.get("/cart",logger,verifyToken, async(req, res)=>{
      let query = {}
      // console.log("token: ",req.cookies.token);
      console.log('Valid User: ',req.user.email);
      console.log(req.query);
      if(req.query?.email){
        query= {email: req.query.email}
      }
      if(req.query.email!==req.user.email){
        return res.status(403).send({message: 'forbidden'})
      }
      const cursor = cartProducts.find(query);
      const result = await cursor.toArray();
      //console.log(result);
      res.send(result);
  })

    app.delete("/cart/:id",async(req, res)=>{
      console.log('Delete a asi: ',req.user);
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await cartProducts.deleteOne(query);
      res.send(result)
    })
  
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send("Server site is running")
})

app.listen(port, ()=>{
    console.log(`Server site is running on port ${port}`);
})