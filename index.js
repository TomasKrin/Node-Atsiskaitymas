require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

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
      _id: user.id,
    }));

    const newUsersAddressArr = responseData.map((user) => ({
      street: user.address.street,
      suite: user.address.suite,
      city: user.address.city,
      _id: user.id,
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
        _id: Date.now(),
      };

      console.log(newUser);

      const newUserAddress = {
        street: req.body.street,
        suite: req.body.suite,
        city: req.body.city,
        _id: newUser._id,
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
      .aggregate([
        {
          $lookup: {
            from: 'addresses',
            localField: '_id',
            foreignField: '_id',
            as: 'address',
          },
        },
        { $unwind: '$address' },
        {
          $project: {
            name: '$name',
            email: '$email',
            address: { $concat: ['$address.street', ', ', '$address.suite', ', ', '$address.city'] },
          },
        },
      ])
      .toArray();
    await con.close();
    console.log(data);
    res.send(data);
  } catch (error) {
    res.status(500).send({ error });
  }
});

app.get('/api/users/names', async (req, res) => {
  try {
    const con = await client.connect();
    const data = await con
      .db('user_db')
      .collection('users')
      .aggregate([
        {
          $project: {
            name: '$name',
          },
        },
      ])
      .toArray();
    await con.close();
    console.log(data);
    res.send(data);
  } catch (error) {
    res.status(500).send({ error });
  }
});

app.get('/api/users/emails', async (req, res) => {
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

app.get('/api/users/address', async (req, res) => {
  try {
    const con = await client.connect();
    const data = await con
      .db('user_db')
      .collection('users')
      .aggregate([
        {
          $lookup: {
            from: 'addresses',
            localField: '_id',
            foreignField: '_id',
            as: 'address',
          },
        },
        { $unwind: '$address' },
        {
          $project: {
            name: '$name',
            email: '$email',
            address: {
              street: '$address.street',
              suite: '$address.suite',
              city: '$address.city',
            },
          },
        },
      ])
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
