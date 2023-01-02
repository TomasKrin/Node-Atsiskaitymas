require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 8080;
const uri = process.env.URI;

const client = new MongoClient(uri);

app.use(cors());
app.use(express.json());

app.post('/api/fill', async (req, res) => {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users');
    const responseData = await response.json();

    const newUsersArr = responseData.map((user) => ({
      name: user.name,
      email: user.email,
      id: user.id,
    }));

    const newUsersAddressArr = responseData.map((user) => ({
      street: user.address.street,
      suite: user.address.suite,
      city: user.address.city,
      id: user.id,
    }));

    const conAddress = await client.connect();
    const dataAddress = await conAddress
      .db('user_db')
      .collection('addresses')
      .insertMany(newUsersAddressArr);
    await conAddress.close();
    console.log(dataAddress);

    const conUser = await client.connect();
    const dataUser = await conUser
      .db('user_db')
      .collection('users')
      .insertMany(newUsersArr);
    await conUser.close();
    console.log(dataUser);
    res.send(dataUser);
  } catch (error) {
    res.status(500).send({ error });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    if (req.body.name && req.body.email && req.body.street && req.body.suite && req.body.city) {
      const newUser = {
        name: req.body.name,
        email: req.body.email,
        id: Date.now(),
      };
      console.log(newUser);

      const newUserAddress = {
        street: req.body.street,
        suite: req.body.suite,
        city: req.body.city,
        id: newUser.id,
      };
      console.log(newUserAddress);

      const conAddress = await client.connect();
      const dataAddress = await conAddress
        .db('user_db')
        .collection('addresses')
        .insertOne(newUserAddress);
      await conAddress.close();
      console.log(dataAddress);

      const conUser = await client.connect();
      const dataUser = await conUser
        .db('user_db')
        .collection('users')
        .insertOne(newUser);
      await conUser.close();
      console.log(dataUser);
      res.send(dataUser);
    } else {
      res.sendStatus(400);
    }
  } catch (error) {
    res.status(500).send({ error });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const con = await client.connect();
    const data = await con
      .db('user_db')
      .collection('users')
      .find()
      .toArray();
    await con.close();
    console.log(data);
    res.send(data);
  } catch (error) {
    res.status(500).send({ error });
  }
});

app.listen(port, () => {
  console.log(`It works on ${port} port`);
});
