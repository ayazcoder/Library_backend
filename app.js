const express = require('express')
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const bodyParser = require('body-parser');
const cors = require('cors');
//connect DB
require('./db/connections')
//import modules
const Users = require("./models/Users")
const Books = require('./models/Books');
const cloudinary = require('cloudinary').v2;

// App use
const app = express()
app.use(express.json())
app.use(cors({ origin: 'http://localhost:5173/' }));
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: true }));
// Configure Cloudinary
cloudinary.config({
    cloud_name: 'dh6jiybqa',
    api_key: '275614475543855',
    api_secret: 'FGjOOyFtiCCKZE6utOx_kxkJuXs'
});
//Port number
const port = process.env.PORT || 5000

//routes
app.get('/', (req, res) => {
    res.send('Welcome')
    res.end()
})
//to upload images to cloudinary and get link
const uploadImageToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'home',
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );
        stream.write(buffer);
        stream.end();
    });
};
//register user api
app.post('/api/register', async (req, res, next) => {
    try {
        const { fullName, email, password } = req.body
        if (!fullName || !email || !password) {
            res.status(400).send("Please Fill all require fields")
        } else {
            isAlreadyExit = await Users.findOne({ email })
            if (isAlreadyExit) {
                res.status(400).send("User already exits")
            } else {
                const newUser = new Users({
                    fullName, email
                })
                bcryptjs.hash(password, 10, (err, hashedPassword) => {
                    newUser.set('password', hashedPassword)
                    newUser.save()
                    next()
                })
                return res.status(200).send('User registered sucessfully')
            }
        }
    } catch (error) {

    }
})
//register user api
app.post('/api/login', async (req, res, next) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            res.status(400).send("Please fill all the fields")
        } else {
            const user = await Users.findOne({ email });
            if (!user) {
                res.status(400).send("User not found.")
            } else {
                const validatePassword = await bcryptjs.compare(password, user.password)
                if (!validatePassword) {
                    res.status(400).send("Password is not correct.")
                } else {
                    const payload = {
                        userId: user._id,
                        email: user.email
                    }
                    console.log(user.token)
                    const JWT_SECRET_Key = process.env.JWT_SECRET_Key || "dyuaeiwijkalsjd"
                    jwt.sign(payload, JWT_SECRET_Key, { expiresIn: '24h' }, async (err, token) => {
                        console.log(token)
                        await Users.updateOne({ _id: user._id }, {
                            $set: { token: token }
                        })
                        user.save()
                        next()
                    })
                    res.status(200).json(user)
                }
            }
        }
    } catch (error) {
        console.log(error)
    }
})
// API endpoint to get all users
app.get('/api/users', async (req, res) => {
    try {
        const users = await Users.find();
        // console.log("users", users)
        const usersData = await users.map((user) => {
            return { user: { email: user.email, fullName: user.fullName }, userId: user._id }
        })
        res.status(200).json(usersData);
        console.log("usersData", usersData)

    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// POST route to create a book with image upload and Cloudinary link
app.post('/api/book', async (req, res) => {
   return   console.log("req:", req.body)
    const { name, title, description } = req.body;

    // let bookImageUrl;

    // try {
    //   if (req.body.image) {
    //     bookImageUrl = await uploadImageToCloudinary(req.body.image);
    //   }
    // } catch (uploadError) {
    //   return res.status(500).json({ message: 'Image upload failed', error: uploadError.message });
    // }

    try {
        console.log(req.body)
        console.log(req.file)
        // Assuming your Books model has fields: name, title, description, image
        const createBook = new Books({
            name,
            title,
            description,
            // image: bookImageUrl
        });
        await createBook.save();
        res.status(200).json(createBook);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send('Internal Server Error');
    }
});
//get book
app.get('/api/books/:id', async (req, res) => {
    const { id } = req.params; // Extract id from URL params

    try {
        const book = await Books.findById(id);

        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        res.status(200).json(book);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
// Delete book
app.delete('/api/books/:id', async (req, res) => {
    const { id } = req.params; // Extract id from URL params

    try {
        const book = await Books.findById(id);

        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        await Books.findByIdAndDelete(id);

        res.status(200).json({ message: 'Book deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
// Update book
app.put('/api/books/:id', async (req, res) => {
    const { id } = req.params;
    const { title, author, description } = req.body;
    try {
        const book = await Books.findById(id);

        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        // Update book fields
        book.title = title || book.title;
        book.author = author || book.author;
        book.description = description || book.description;

        // Save the updated book
        const updatedBook = await book.save();

        res.status(200).json(updatedBook);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

//get all books
app.get('/api/books', async (req, res) => {
    try {
        const books = await Books.find();
        res.status(200).json(books);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


//port used
app.listen(port, () => {
    console.log("port :", port)
})