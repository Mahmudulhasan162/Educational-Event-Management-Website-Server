const express = require("express");
const cors = require('cors');
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

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

    app.post("/cart", async(req, res)=>{
      const cart = req.body;
      console.log(cart);
      const result= await cartProducts.insertOne(cart);
      res.send(result);
    })
    app.delete("/cart/:id", async(req, res)=>{
      const id = req.params.id;
      const query = {_id: id}
      const result = await cartProducts.deleteOne(query);
      res.send(result);
    })
    app.get("/cart", async(req, res)=>{
      const cursor = cartProducts.find();
      const result = await cursor.toArray();
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