const express = require('express');
const cors = require('cors');
const voiceRoutes = require('./routes/voice');
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/voice', voiceRoutes);
app.listen(5000, () => console.log('Server on 5000 - NO DB'));
