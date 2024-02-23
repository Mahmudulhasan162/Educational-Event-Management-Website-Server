const express = require("express");
const cors = require('cors');
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.port || 5000;

//middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://educational-events-aaeb4.web.app'
    
  ],
  credentials: true
}))
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tbshjw2.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    

    const serviceCollection = client.db("EventData").collection("services");
    const dataCollection = client.db('EventData').collection('allData');
    const cartProducts = client.db('EventData').collection('cart');

    app.get('/services', async(req,res)=>{
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })
    
    app.get('/allData', async(req,res)=>{
      const cursor = dataCollection.find();
      const result = await cursor.toArray();
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

    app.post("/cart", async(req, res)=>{
      const cart = req.body;
      const result= await cartProducts.insertOne(cart);
      console.log("cart a add holam ami",result);
      res.send(result);
    })

    app.get("/cart", async(req, res)=>{
      let query = {}
      console.log(req.query);
      if(req.query?.email){
        query= {email: req.query.email}
        console.log(query);
      }
      const cursor = cartProducts.find(query);
      const result = await cursor.toArray();
      //console.log(result);
      res.send(result);
  })

    app.delete("/cart/:id", async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await cartProducts.deleteOne(query);
      res.send(result);
    })
  
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
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