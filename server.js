// backend/server.js
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'student_housing',
  password: 'admin', // ИЗМЕНИТЕ НА ВАШ ПАРОЛЬ
  port: 5432,
});

const JWT_SECRET = 'secret123';

const auth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// ============ AUTH ROUTES ============ 

app.post('/api/auth/register/student', async (req, res) => {
  try {
    const { firstName, lastName, email, password, university } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO students (first_name, last_name, email, password_hash, university, date_of_birth) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING student_id, email, first_name, last_name`,
      [firstName, lastName, email, hashedPassword, university || 'КазНУ', '2000-01-01']
    );

    const token = jwt.sign({ id: result.rows[0].student_id, type: 'student' }, JWT_SECRET);
    res.json({ token, user: { ...result.rows[0], userType: 'student' } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login/student', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM students WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }

    const student = result.rows[0];
    const validPassword = await bcrypt.compare(password, student.password_hash);

    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ id: student.student_id, type: 'student' }, JWT_SECRET);
    res.json({
      token,
      user: {
        student_id: student.student_id,
        email: student.email,
        first_name: student.first_name,
        last_name: student.last_name,
        userType: 'student'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/register/landlord', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, companyName } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO landlords (first_name, last_name, email, phone, password_hash, company_name, rating) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING landlord_id, email, first_name, last_name, phone, company_name, rating`,
      [firstName, lastName, email, phone, hashedPassword, companyName || null, 4.0]
    );

    const token = jwt.sign({ id: result.rows[0].landlord_id, type: 'landlord' }, JWT_SECRET);
    res.json({
      token,
      user: {
        ...result.rows[0],
        userType: 'landlord'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login/landlord', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Landlord login attempt:', email);

    const result = await pool.query('SELECT * FROM landlords WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      console.log('Landlord not found');
      return res.status(400).json({ error: 'Владелец не найден' });
    }

    const landlord = result.rows[0];
    console.log('Landlord found:', landlord.first_name);

    const validPassword = await bcrypt.compare(password, landlord.password_hash);
    console.log('Password valid:', validPassword);

    if (!validPassword) {
      console.log('Invalid password');
      return res.status(400).json({ error: 'Неверный пароль' });
    }

    const token = jwt.sign({ id: landlord.landlord_id, type: 'landlord' }, JWT_SECRET);
    console.log('✅ Login successful');

    res.json({
      token,
      user: {
        landlord_id: landlord.landlord_id,
        email: landlord.email,
        first_name: landlord.first_name,
        last_name: landlord.last_name,
        phone: landlord.phone,
        company_name: landlord.company_name,
        rating: landlord.rating || 4.0, // ДОБАВЛЕНО: по умолчанию 4.0
        userType: 'landlord'
      }
    });
  } catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============ PROPERTIES ROUTES ============

app.get('/api/properties', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, 
             l.first_name || ' ' || l.last_name as landlord_name,
             COUNT(r.room_id) as total_rooms_count,
             COUNT(CASE WHEN r.is_available = true THEN 1 END) as available_rooms,
             MIN(r.price_per_month) as min_price,
             COALESCE(AVG(rev.rating), 0) as avg_rating
      FROM properties p
      JOIN landlords l ON p.landlord_id = l.landlord_id
      LEFT JOIN rooms r ON p.property_id = r.property_id
      LEFT JOIN reviews rev ON p.property_id = rev.property_id
      GROUP BY p.property_id, l.first_name, l.last_name
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

app.get('/api/landlord/properties', auth, async (req, res) => {
  try {
    if (req.user.type !== 'landlord') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(`
      SELECT p.*, 
             COUNT(r.room_id) as total_rooms_count,
             COUNT(CASE WHEN r.is_available = true THEN 1 END) as available_rooms,
             COUNT(DISTINCT rc.contract_id) as active_contracts
      FROM properties p
      LEFT JOIN rooms r ON p.property_id = r.property_id
      LEFT JOIN rental_contracts rc ON r.room_id = rc.room_id AND rc.status = 'active'
      WHERE p.landlord_id = $1
      GROUP BY p.property_id
      ORDER BY p.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

app.post('/api/landlord/properties', auth, async (req, res) => {
  try {
    if (req.user.type !== 'landlord') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { address, city, district, propertyType, totalRooms, totalArea, description } = req.body;

    const result = await pool.query(`
      INSERT INTO properties (landlord_id, address, city, district, property_type, total_rooms, total_area, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [req.user.id, address, city, district, propertyType, totalRooms, totalArea, description]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create property' });
  }
});

app.post('/api/landlord/rooms', auth, async (req, res) => {
  try {
    if (req.user.type !== 'landlord') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { propertyId, roomNumber, roomArea, capacity, pricePerMonth, amenities } = req.body;

    const propertyCheck = await pool.query(
      'SELECT * FROM properties WHERE property_id = $1 AND landlord_id = $2',
      [propertyId, req.user.id]
    );

    if (propertyCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Property not found or access denied' });
    }

    const result = await pool.query(`
      INSERT INTO rooms (property_id, room_number, room_area, capacity, price_per_month, amenities)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [propertyId, roomNumber, roomArea, capacity, pricePerMonth, amenities]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add room' });
  }
});

app.get('/api/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const property = await pool.query(`
      SELECT p.*, l.first_name || ' ' || l.last_name as landlord_name, 
             l.phone as landlord_phone, l.landlord_id
      FROM properties p
      JOIN landlords l ON p.landlord_id = l.landlord_id
      WHERE p.property_id = $1
    `, [id]);

    const rooms = await pool.query('SELECT * FROM rooms WHERE property_id = $1', [id]);

    const reviews = await pool.query(`
      SELECT r.*, s.first_name || ' ' || s.last_name as student_name
      FROM reviews r
      JOIN students s ON r.student_id = s.student_id
      WHERE r.property_id = $1
      ORDER BY r.review_date DESC
    `, [id]);

    res.json({
      ...property.rows[0],
      rooms: rooms.rows,
      reviews: reviews.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch property' });
  }
});

// ============ CHAT ROUTES ============

app.get('/api/chat/conversations', auth, async (req, res) => {
  try {
    const { id, type } = req.user;
    let query;

    if (type === 'student') {
      query = `
        SELECT c.*, 
               l.first_name || ' ' || l.last_name as landlord_name,
               p.address,
               (SELECT message_text FROM chat_messages 
                WHERE conversation_id = c.conversation_id 
                ORDER BY created_at DESC LIMIT 1) as last_message
        FROM chat_conversations c
        JOIN landlords l ON c.landlord_id = l.landlord_id
        LEFT JOIN properties p ON c.property_id = p.property_id
        WHERE c.student_id = $1
        ORDER BY c.updated_at DESC
      `;
    } else {
      query = `
        SELECT c.*, 
               s.first_name || ' ' || s.last_name as student_name,
               p.address,
               (SELECT message_text FROM chat_messages 
                WHERE conversation_id = c.conversation_id 
                ORDER BY created_at DESC LIMIT 1) as last_message
        FROM chat_conversations c
        JOIN students s ON c.student_id = s.student_id
        LEFT JOIN properties p ON c.property_id = p.property_id
        WHERE c.landlord_id = $1
        ORDER BY c.updated_at DESC
      `;
    }

    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

app.get('/api/chat/messages/:conversationId', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const result = await pool.query(`
      SELECT * FROM chat_messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
    `, [conversationId]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/chat/conversations', auth, async (req, res) => {
  try {
    const { landlordId, propertyId } = req.body;
    const studentId = req.user.id;

    let result = await pool.query(`
      SELECT * FROM chat_conversations
      WHERE student_id = $1 AND landlord_id = $2
    `, [studentId, landlordId]);

    if (result.rows.length === 0) {
      result = await pool.query(`
        INSERT INTO chat_conversations (student_id, landlord_id, property_id)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [studentId, landlordId, propertyId]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// ============ FORUM ROUTES ============

app.get('/api/forum/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, COUNT(p.post_id) as post_count
      FROM forum_categories c
      LEFT JOIN forum_posts p ON c.category_id = p.category_id
      GROUP BY c.category_id
      ORDER BY c.category_id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Найдите и замените:

app.post('/api/forum/posts', auth, async (req, res) => {
  try {
    const { categoryId, title, content } = req.body;
    const { id, type } = req.user;

    const result = await pool.query(`
      INSERT INTO forum_posts (category_id, student_id, title, content, author_type, author_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      categoryId,
      type === 'student' ? id : null,  // NULL для владельцев
      title,
      content,
      type,   // 'student' или 'landlord'
      id      // ID пользователя
    ]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Forum post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Обновите получение постов категории:

app.get('/api/forum/posts/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const result = await pool.query(`
      SELECT 
        p.*,
        CASE 
          WHEN p.author_type = 'student' THEN s.first_name || ' ' || s.last_name
          WHEN p.author_type = 'landlord' THEN l.first_name || ' ' || l.last_name
          ELSE 'Аноним'
        END as author_name,
        COUNT(DISTINCT c.comment_id) as comment_count,
        COUNT(DISTINCT lk.like_id) as like_count
      FROM forum_posts p
      LEFT JOIN students s ON p.author_id = s.student_id AND p.author_type = 'student'
      LEFT JOIN landlords l ON p.author_id = l.landlord_id AND p.author_type = 'landlord'
      LEFT JOIN forum_comments c ON p.post_id = c.post_id
      LEFT JOIN forum_post_likes lk ON p.post_id = lk.post_id
      WHERE p.category_id = $1
      GROUP BY p.post_id, s.first_name, s.last_name, l.first_name, l.last_name
      ORDER BY p.is_pinned DESC, p.created_at DESC
    `, [categoryId]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Обновите получение одного поста:

app.get('/api/forum/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    await pool.query('UPDATE forum_posts SET views = views + 1 WHERE post_id = $1', [postId]);

    const post = await pool.query(`
      SELECT 
        p.*, 
        CASE 
          WHEN p.author_type = 'student' THEN s.first_name || ' ' || s.last_name
          WHEN p.author_type = 'landlord' THEN l.first_name || ' ' || l.last_name
          ELSE 'Аноним'
        END as author_name,
        p.author_type,
        COUNT(DISTINCT lk.like_id) as like_count
      FROM forum_posts p
      LEFT JOIN students s ON p.author_id = s.student_id AND p.author_type = 'student'
      LEFT JOIN landlords l ON p.author_id = l.landlord_id AND p.author_type = 'landlord'
      LEFT JOIN forum_post_likes lk ON p.post_id = lk.post_id
      WHERE p.post_id = $1
      GROUP BY p.post_id, s.first_name, s.last_name, l.first_name, l.last_name
    `, [postId]);

    const comments = await pool.query(`
      SELECT 
        c.*,
        CASE 
          WHEN c.author_type = 'student' THEN s.first_name || ' ' || s.last_name
          WHEN c.author_type = 'landlord' THEN l.first_name || ' ' || l.last_name
          ELSE 'Аноним'
        END as author_name
      FROM forum_comments c
      LEFT JOIN students s ON c.author_id = s.student_id AND c.author_type = 'student'
      LEFT JOIN landlords l ON c.author_id = l.landlord_id AND c.author_type = 'landlord'
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `, [postId]);

    res.json({
      ...post.rows[0],
      comments: comments.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

app.post('/api/forum/comments', auth, async (req, res) => {
  try {
    const { postId, content } = req.body;
    const { id, type } = req.user;

    const result = await pool.query(`
      INSERT INTO forum_comments (post_id, student_id, content, author_type, author_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      postId,
      type === 'student' ? id : null,  // NULL для владельцев
      content,
      type,  // 'student' или 'landlord'
      id     // ID пользователя (student_id или landlord_id)
    ]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Forum comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

app.post('/api/forum/posts/:postId/like', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const studentId = req.user.id;

    const existing = await pool.query(
      'SELECT * FROM forum_post_likes WHERE post_id = $1 AND student_id = $2',
      [postId, studentId]
    );

    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM forum_post_likes WHERE post_id = $1 AND student_id = $2',
        [postId, studentId]);
      res.json({ liked: false });
    } else {
      await pool.query('INSERT INTO forum_post_likes (post_id, student_id) VALUES ($1, $2)',
        [postId, studentId]);
      res.json({ liked: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

// ============ SOCKET.IO ============

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`User joined conversation ${conversationId}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const { conversationId, senderType, senderId, messageText } = data;

      const result = await pool.query(`
        INSERT INTO chat_messages (conversation_id, sender_type, sender_id, message_text)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [conversationId, senderType, senderId, messageText]);
      // 1. Отправляем сообщение в комнату чата
      io.to(conversationId).emit('new_message', result.rows[0]);

      // 2. ДОБАВЬ ЭТО: Сигналим ВСЕМ, чтобы обновили список чатов
      // (В идеале слать только участникам, но для начала можно всем)
      io.emit('update_chat_list');

      await pool.query(
        'UPDATE chat_conversations SET updated_at = NOW() WHERE conversation_id = $1',
        [conversationId]
      );

      io.to(`conversation_${conversationId}`).emit('new_message', result.rows[0]);
    } catch (error) {
      console.error('Error sending message:', error);
    }

    io.emit('update_chat_list');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});