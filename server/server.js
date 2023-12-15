const Document = require('./model/Document');
const mongoose = require('mongoose');
const { Types: { ObjectId } } = mongoose;
const io = require("socket.io")(3001, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Connect to MongoDB
mongoose.connect('mongodb://localhost/googleDocs-clone');



const dbConnection = mongoose.connection;

dbConnection.on("error", (error) => {
  console.error("MongoDB connection error:", error);
});

dbConnection.once("open", () => {
  console.log("Connected to MongoDB");
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("get-document", async (documentId) => {
    const document = await findCreateDocument(documentId);
    socket.join(documentId);
    socket.emit('load-document', document.data);

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

const defaultValue = "";

async function findCreateDocument(id) {
  if (id == null) return;

  const document = await Document.findById(id);

  if (document) return document;

  return await Document.create({ _id: id, data: defaultValue });
}
