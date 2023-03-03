/** User class for message.ly */
const db = require('../db')
const ExpressError = require('../expressError')
const bcrypt = require('bcrypt')
const {authenticateJWT, ensureLoggedIn, ensureCorrectUser} = require('../middleware/auth');
const { BCRYPT_WORK_FACTOR } = require('../config');


/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */
  //do I need a constructor ? Do we want to be able to instantiate users???
  // constructor(username, first_name, last_name, phone) {
  //   this.username = username;
  //   this.first_name = first_name;
  //   this.last_name = last_name;
  //   this.phone = phone;
  // }

  static async register({username, password, first_name, last_name, phone}) {
    if (!username || !password) {
      throw new ExpressError('Required data missing', 400)
    }
    let hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
      `INSERT INTO users 
        SET (username, password, first_name, last_name, phone)
        VALUES ($1, $2, $3, $4, $5) RETURNING username, password, first_name, last_name, phone`, //why do we want the hashed pwd back??
      [username, hashedPassword, first_name, last_name, phone]
    )
    return result.rows[0]
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    if (!username || !password) {
      throw new ExpressError('Required data missing', 400)
    }
    const result = await db.query(`SELECT password FROM users WHERE username = $1`, [username])
    let user = result.rows[0];
    return user && await bcrypt.compare(password, user.password)

  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(`
      INSERT INTO users
        SET last_login_at = current_timestamp
        WHERE username = $1
      `,
      [username]);
    if (!result.rows[0]) {
      throw new ExpressError('User not found', 404)
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const results = await db.query(
      `SELECT username, first_name, last_name, phone FROM users`
    )
    if (results.rows.length === 0) {
      throw new ExpressError('No users found', 404)
    }
    return results
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    if (!username) {
      throw new ExpressError('Enter username', 400)
    }
    const result = await db.query(
      `SELECT username, first_name, last_name, phone FROM users WHERE username = $1`,
      [username]
    )
    if (result.rows.length === 0) {
      throw new ExpressError('User not found', 404)
    }
    return result.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    if (!username) {
      throw new ExpressError('Enter username', 400)
    }
    const result = await db.query(
      `SELECT id, to_username, body, sent_at, read_at 
        FROM messages
        WHERE to_username = $1`,
      [username]
    )
    if (result.rows.length === 0) {
      throw new ExpressError('No messages yet', 404)
    }
    return result.rows[0];
  }

  //extra version w/ user detail
  // static async messagesFrom(username) {
  //   const result = await db.query(
  //       `SELECT m.id,
  //               m.to_username,
  //               u.first_name,
  //               u.last_name,
  //               u.phone,
  //               m.body,
  //               m.sent_at,
  //               m.read_at
  //         FROM messages AS m
  //           JOIN users AS u ON m.to_username = u.username
  //         WHERE from_username = $1`,
  //       [username]);

  //   return result.rows.map(m => ({
  //     id: m.id,
  //     to_user: {
  //       username: m.to_username,
  //       first_name: m.first_name,
  //       last_name: m.last_name,
  //       phone: m.phone
  //     },
  //     body: m.body,
  //     sent_at: m.sent_at,
  //     read_at: m.read_at
  //   }));

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    if (!username) {
      throw new ExpressError('Enter username', 400)
    }
    const result = await db.query(
      `SELECT id, from_username, body, sent_at, read_at 
        FROM messages
        WHERE from_username = $1`,
      [username]
    )
    if (result.rows.length === 0) {
      throw new ExpressError('No messages yet', 404)
    }
    return result.rows[0];
  }

  //extra user detail
  // static async messagesTo(username) {
  //   const result = await db.query(
  //       `SELECT m.id,
  //               m.from_username,
  //               u.first_name,
  //               u.last_name,
  //               u.phone,
  //               m.body,
  //               m.sent_at,
  //               m.read_at
  //         FROM messages AS m
  //          JOIN users AS u ON m.from_username = u.username
  //         WHERE to_username = $1`,
  //       [username]);

  //   return result.rows.map(m => ({
  //     id: m.id,
  //     from_user: {
  //       username: m.from_username,
  //       first_name: m.first_name,
  //       last_name: m.last_name,
  //       phone: m.phone,
  //     },
  //     body: m.body,
  //     sent_at: m.sent_at,
  //     read_at: m.read_at
  //   }));
  // }
}


module.exports = User;