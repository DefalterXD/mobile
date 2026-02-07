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
  password: 'admin',
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

// AUTH ROUTES 

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
    console.log('Login successful');

    res.json({
      token,
      user: {
        landlord_id: landlord.landlord_id,
        email: landlord.email,
        first_name: landlord.first_name,
        last_name: landlord.last_name,
        phone: landlord.phone,
        company_name: landlord.company_name,
        rating: landlord.rating || 4.0,
        userType: 'landlord'
      }
    });
  } catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// PROPERTIES ROUTES

app.put('/api/profile/update', auth, async (req, res) => {
    try {
        const { id, type } = req.user; // Берем данные из ТОКЕНА (безопасно)
        // Приводим ключи с фронтенда к единому стандарту
        const { firstName, lastName, avatarUrl, phone, companyName, university } = req.body;
        
        console.log(`Обновление профиля для ${type}, ID: ${id}`);

        let result;
        if (type === 'student') {
            result = await pool.query(
                `UPDATE students 
                 SET first_name = $1, last_name = $2, avatar_url = $3, university = $4
                 WHERE student_id = $5 
                 RETURNING student_id, first_name, last_name, email, university, avatar_url`,
                [firstName, lastName, avatarUrl, university, id]
            );
        } else {
            // Для владельца
            result = await pool.query(
                `UPDATE landlords 
                 SET first_name = $1, last_name = $2, avatar_url = $3, phone = $4, company_name = $5
                 WHERE landlord_id = $6 
                 RETURNING landlord_id, first_name, last_name, email, phone, company_name, avatar_url, rating`,
                [firstName, lastName, avatarUrl, phone, companyName, id]
            );
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Пользователь не найден" });
        }

        // Формируем чистый объект ответа, чтобы фронтенд не сходил с ума
        const updatedUser = { 
            ...result.rows[0], 
            userType: type // Явно прописываем тип из токена
        };
        
        console.log("✅ Профиль обновлен:", updatedUser.first_name);
        res.json(updatedUser);
    } catch (error) {
        console.error("🔥 Ошибка обновления профиля:", error.message);
        res.status(500).json({ error: 'Ошибка сервера при обновлении' });
    }
});

// В server.js
app.put('/api/profile/update-landlord', async (req, res) => {
    console.log("Запрос получен!", req.body); // Добавь это для отладки
    try {
        const { landlord_id, first_name, last_name, phone, company_name, avatar_url } = req.body;
        
        // ВАЖНО: Убедись, что колонка в БД называется именно landlord_id, а не id
        const result = await pool.query(
            `UPDATE landlords 
             SET first_name = $1, last_name = $2, phone = $3, company_name = $4, avatar_url = $5 
             WHERE landlord_id = $6 
             RETURNING *`,
            [first_name, last_name, phone, company_name, avatar_url, landlord_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Владелец не найден" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Ошибка SQL:", err.message);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

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

// CHAT ROUTES 

app.get('/api/chat/conversations', auth, async (req, res) => {
  try {
    const { id, type } = req.user;
    let query;

    if (type === 'student') {
      // Для студента вытягиваем имя и АВАТАРКУ лендлорда
      query = `
        SELECT c.*, 
               l.first_name || ' ' || l.last_name as landlord_name,
               l.avatar_url as landlord_avatar,
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
      // Для лендлорда вытягиваем имя и АВАТАРКУ студента
      query = `
        SELECT c.*, 
               s.first_name || ' ' || s.last_name as student_name,
               s.avatar_url as student_avatar,
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
    console.error("Ошибка при получении чатов:", error);
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

// ============ FORUM ROUTES ============

// 1. Получение категорий
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
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// 2. Получение списка постов в категории
app.get('/api/forum/posts/:categoryId', async (req, res) => {
  const { categoryId } = req.params;
  try {
    const query = `
      SELECT 
        p.*, 
        COALESCE(s.first_name || ' ' || s.last_name, l.first_name || ' ' || l.last_name, 'Аноним') as author_name,
        COALESCE(s.avatar_url, l.avatar_url, '') as author_avatar,
        (SELECT COUNT(*) FROM forum_comments WHERE post_id = p.post_id) as comment_count,
        (SELECT COUNT(*) FROM forum_post_likes WHERE post_id = p.post_id) as like_count
      FROM forum_posts p
      LEFT JOIN students s ON p.author_id = s.student_id AND p.author_type = 'student'
      LEFT JOIN landlords l ON p.author_id = l.landlord_id AND p.author_type = 'landlord'
      WHERE p.category_id = $1
      ORDER BY p.is_pinned DESC, p.created_at DESC;
    `;
    const result = await pool.query(query, [categoryId]);
    res.json(result.rows);
  } catch (err) {
    console.error("GET POSTS ERROR:", err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// 3. Получение одного поста и комментариев к нему
app.get('/api/forum/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const viewerId = req.query.viewerId || null;
    await pool.query('UPDATE forum_posts SET views = views + 1 WHERE post_id = $1', [postId]);

    const postResult = await pool.query(`
      SELECT p.*, 
        COALESCE(s.first_name || ' ' || s.last_name, l.first_name || ' ' || l.last_name, 'Аноним') as author_name,
        COALESCE(s.avatar_url, l.avatar_url) as author_avatar,
        -- ПРОВЕРКА ЛАЙКА: возвращает true/false
        EXISTS(SELECT 1 FROM forum_post_likes WHERE post_id = p.post_id AND user_id = $2) as user_liked,
        (SELECT COUNT(*) FROM forum_post_likes WHERE post_id = p.post_id) as like_count
      FROM forum_posts p
      LEFT JOIN students s ON p.author_id = s.student_id AND p.author_type = 'student'
      LEFT JOIN landlords l ON p.author_id = l.landlord_id AND p.author_type = 'landlord'
      WHERE p.post_id = $1
    `, [postId, viewerId]);

    if (postResult.rows.length === 0) return res.status(404).json({ error: 'Post not found' });

    const commentsResult = await pool.query(`
      SELECT c.*, 
             COALESCE(s.first_name || ' ' || s.last_name, l.first_name || ' ' || l.last_name) as author_name,
             COALESCE(s.avatar_url, l.avatar_url) as author_avatar
      FROM forum_comments c
      LEFT JOIN students s ON c.author_id = s.student_id AND c.author_type = 'student'
      LEFT JOIN landlords l ON c.author_id = l.landlord_id AND c.author_type = 'landlord'
      WHERE c.post_id = $1 ORDER BY c.created_at ASC
    `, [postId]);

    res.json({ ...postResult.rows[0], comments: commentsResult.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// 4. Создание поста
app.post('/api/forum/posts', auth, async (req, res) => {
  try {
    const { categoryId, title, content } = req.body;
    const { id, type } = req.user;
    const result = await pool.query(`
      INSERT INTO forum_posts (category_id, author_id, author_type, title, content)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [categoryId, id, type, title, content]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// 5. Редактирование поста
app.put('/api/forum/post/:postId', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, content } = req.body; 
    const { id } = req.user;
    const result = await pool.query(
      `UPDATE forum_posts 
       SET title = $1, content = $2 
       WHERE post_id = $3 AND author_id = $4 
       RETURNING *`,
      [title, content, postId, id]
    );
    if (result.rows.length === 0) return res.status(403).json({ error: "No permission" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error updating post" });
  }
});

// 6. Удаление поста
app.delete('/api/forum/post/:postId', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { id } = req.user;
    const result = await pool.query(
      'DELETE FROM forum_posts WHERE post_id = $1 AND author_id = $2 RETURNING *',
      [postId, id]
    );
    if (result.rows.length === 0) return res.status(403).json({ error: "No permission" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting post' });
  }
});

// 7. Добавление комментария
app.post('/api/forum/comments', auth, async (req, res) => {
  try {
    const { postId, content } = req.body;
    const { id, type } = req.user;
    const result = await pool.query(`
      INSERT INTO forum_comments (post_id, author_id, author_type, content)
      VALUES ($1, $2, $3, $4) RETURNING *
    `, [postId, id, type, content]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// 8. Удаление комментария
app.delete('/api/forum/comments/:commentId', auth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { id } = req.user;
    const result = await pool.query(
      'DELETE FROM forum_comments WHERE comment_id = $1 AND author_id = $2 RETURNING *',
      [commentId, id]
    );
    if (result.rows.length === 0) return res.status(403).json({ error: "No permission" });
    res.json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});

// 9. Лайк/Дизлайк (Универсальный: user_id + user_type)
app.post('/api/forum/posts/:postId/like', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { id, type } = req.user; 

    // Сначала ищем существующий лайк по универсальному полю user_id
    const existing = await pool.query(
      'SELECT * FROM forum_post_likes WHERE post_id = $1 AND user_id = $2 AND user_type = $3',
      [postId, id, type]
    );

    if (existing.rows.length > 0) {
      // Дизлайк
      await pool.query(
        'DELETE FROM forum_post_likes WHERE post_id = $1 AND user_id = $2 AND user_type = $3',
        [postId, id, type]
      );
      res.json({ liked: false });
    } else {
      // Лайк
      await pool.query(
        'INSERT INTO forum_post_likes (post_id, user_id, user_type) VALUES ($1, $2, $3)',
        [postId, id, type]
      );
      res.json({ liked: true });
    }
  } catch (error) {
    console.error("LIKE ERROR:", error.message);
    res.status(500).json({ error: error.message });
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