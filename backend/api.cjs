const express = require('express')
const cors = require('cors')
const mysql = require('mysql2')
const session = require('express-session')

const app = express()

app.use(
  cors({
    origin: 'http://localhost:9000',
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(
  session({
    secret: 'secureKey123',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 60, // 1 sat
    },
  }),
)

const connection = mysql.createPool({
  host: 'ucka.veleri.hr',
  user: 'lvalenta',
  password: '11',
  database: 'lvalenta',
})

connection.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.message)
    process.exit(1)
  }
  console.log('Connected to MySQL database!')
  connection.release()
})

module.exports = connection

app.get('/api/check', (req, res) => {
  if (req.session.korisnik) {
    res.json({ loggedIn: true, korisnik: req.session.user })
  } else {
    res.json({ loggedIn: false })
  }
})

app.post('/api/login', (req, res) => {
  const { email, password } = req.body

  const sql = 'SELECT * FROM korisnik WHERE email_korisnika = ? AND password = ?'

  connection.query(sql, [email, password], (err, results) => {
    if (err) return res.status(500).json({ error: 'Greška na serveru' })
    if (results.length === 0) return res.status(401).json({ error: 'Neispravni podaci' })

    const user = results[0]

    req.session.korisnik = {
      sifra_korisnika: user.sifra_korisnika,
      email_korisnika: user.email_korisnika,
    }

    res.status(200).json({
      success: true,
      korisnik: req.session.korisnik,
    })
  })
})

//prikaz opreme
app.get('/api/artikli', (req, res) => {
  const sql = `SELECT
      art.naziv_artikla,
      art.dostupna_kolicina,
      art.cijena_dan,
      lok.sifra_lokacije,
      lok.naziv_lokacije,
      lok.adresa_lokacije
    FROM artikli art
    JOIN lokacije lok ON lok.sifra_lokacije = art.sifra_lokacije`
  connection.query(sql, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    res.status(200).json(results)
  })
})

app.get('/api/artikliSearch', (req, res) => {
  const { query, searchByNaziv } = req.query

  let sql = `
    SELECT
      art.naziv_artikla,
      art.dostupna_kolicina,
      art.cijena_dan,
      lok.sifra_lokacije,
      lok.naziv_lokacije,
      lok.adresa_lokacije
    FROM artikli art
    JOIN lokacije lok ON lok.sifra_lokacije = art.sifra_lokacije
  `
  const params = []

  if (query) {
    const lowerQuery = `%${query.toLowerCase()}%`

    if (searchByNaziv === 'true') {
      sql += ' AND LOWER(art.naziv_artikla) LIKE ?'
      params.push(lowerQuery)
    }
  }

  connection.query(sql, params, (err, results) => {
    if (err) {
      console.error('Greška kod pretraživanja artikala:', err)
      return res.status(500).json({ error: 'Greška na serveru' })
    }

    res.status(200).json(results)
  })
})

app.post('/api/narudzba', (req, res) => {
  if (!req.session.korisnik) {
    return res.status(401).json({ error: 'Niste prijavljeni' })
  }

  const korisnikId = req.session.korisnik.sifra_korisnika
  const stavke = req.body.stavke
  const nacinPlacanja = req.body.nacinPlacanja
  const datumIznajmljivanja = req.body.datumIznajmljivanja
  const datumVracanja = req.body.datumVracanja
  const sifra_lokacije = req.body.sifraLokacije
  const ukupanIznos = req.body.ukupnaCijena

  if (!Array.isArray(stavke) || stavke.length === 0) {
    return res.status(400).json({ error: 'Košarica je prazna' })
  }

  // 1. Ubacujemo narudžbu
  const sqlNarudzba =
    'INSERT INTO narudzbe (sifra_korisnika, datum_iznajmljivanja, datum_vracanja, ukupan_iznos, sifra_lokacije) VALUES (?, ?, ?, ?, ?)'

  connection.query(
    sqlNarudzba,
    [korisnikId, datumIznajmljivanja, datumVracanja, ukupanIznos, sifra_lokacije],
    (err, result) => {
      if (err) {
        console.error('Greška kod unosa narudžbe:', err)
        return res.status(500).json({ error: 'Greška kod unosa narudžbe' })
      }

      const narudzbaId = result.insertId

      // 2. Ubacujemo plaćanje
      const sqlPlacanje = 'INSERT INTO placanja (sifra_narudzbe, nacin_placanja) VALUES (?, ?)'

      connection.query(sqlPlacanje, [narudzbaId, nacinPlacanja], (err2) => {
        if (err2) {
          console.error('Greška kod unosa plaćanja:', err2)
          return res.status(500).json({ error: 'Greška kod unosa plaćanja' })
        }
        res.status(201).json({ success: true, narudzbaId })
      })
    },
  )
})

app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: 'Greška pri odjavi' })
    res.clearCookie('connect.sid') // naziv ovisi o session configu
    res.json({ message: 'Odjava uspješna' })
  })
})

/*
app.post('/api/narudzba', (req, res) => {
  const {
    sifra_korisnika,
    sifra_lokacije,
    datum_iznajmljivanja,
    datum_vracanja,
    ukupan_iznos,
    artikli,
    nacin_placanja,
  } = req.body

  const sqlNarudzba = `
    INSERT INTO narudzbe (sifra_korisnika, datum_iznajmljivanja, datum_vracanja, ukupan_iznos, sifra_lokacije)
    VALUES (?, ?, ?, ?, ?)
  `

  connection.query(
    sqlNarudzba,
    [sifra_korisnika, datum_iznajmljivanja, datum_vracanja, ukupan_iznos, sifra_lokacije],
    (err, result) => {
      if (err) {
        console.error('Greška prilikom spremanja narudžbe:', err)
        return res.status(500).json({ error: 'Greška prilikom spremanja narudžbe' })
      }

      const narudzbaId = result.insertId

      // Spremi stavke narudžbe
      const stavkeSql = `
        INSERT INTO stavke_narudzbe (sifra_narudzbe, sifra_artikla)
        VALUES ?
      `
      const stavkeData = artikli.map((id) => [narudzbaId, id])

      connection.query(stavkeSql, [stavkeData], (err2) => {
        if (err2) {
          console.error('Greška pri unosu stavki narudžbe:', err2)
          return res.status(500).json({ error: 'Greška pri unosu stavki narudžbe' })
        }

        // Spremi način plaćanja
        const placanjeSql = `
          INSERT INTO placanja (sifra_narudzbe, nacin_placanja, status_placanja)
          VALUES (?, ?, 1)
        `

        connection.query(placanjeSql, [narudzbaId, nacin_placanja], (err3) => {
          if (err3) {
            console.error('Greška pri unosu plaćanja:', err3)
            return res.status(500).json({ error: 'Greška pri unosu plaćanja' })
          }

          res.status(200).json({ message: 'Narudžba spremljena' })
        })
      })
    },
  )
})

//registracija
app.post('/api/korisnici', (req, res) => {
  const {
    sifra_korisnika,
    ime_korisnika,
    prezime_korisnika,
    broj_telefona_korisnika,
    email_korisnika,
  } = req.body
  const sql =
    'INSERT INTO korisnici (sifra_korisnika, ime_korisnika, prezime_korisnika, broj_telefona_korisnika, email_korisnika) VALUES (?, ?, ?, ?, ?)'
  const values = [
    sifra_korisnika,
    ime_korisnika,
    prezime_korisnika,
    broj_telefona_korisnika,
    email_korisnika,
  ]

  connection.query(sql, values, (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    res.status(201).json({
      id: result.insertId,
      sifra_korisnika,
      ime_korisnika,
      prezime_korisnika,
      broj_telefona_korisnika,
      email_korisnika,
    })
  })
})

//dodavanje terena
app.post('/api/tereniAdd', isAuthenticated, (req, res) => {
  const { Naziv, Lokacija, Radno_vrijeme } = req.body
  const sql = 'INSERT INTO Tereni (Naziv, Lokacija, Radno_vrijeme) VALUES (?, ?, ?)'
  const values = [Naziv, Lokacija, Radno_vrijeme]

  connection.query(sql, values, (err) => {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    res.status(200).json({ message: 'Tereni updated successfully' })
  })
})

//admin login
app.post('/api/admin', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' })
  }

  const query = 'SELECT * FROM Admin WHERE username = ? AND password = ?'
  connection.query(query, [username, password], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' })
    }

    if (results.length > 0) {
      req.session.user = { id: results[0].id, username: results[0].username }
      res.json({ success: true, message: 'Login successful' })
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' })
    }
  })
})

app.get('/api/auth/check', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ authenticated: true })
  } else {
    res.json({ authenticated: false })
  }
})

//pregled_rezervacija
app.get('/api/rezervacije', (req, res) => {
  const query = `
    SELECT
  r.sifra_narudzbe,
  r.datum_iznajmljivanja,
  k.ime_korisnika,
  k.prezime_korisnika,
  t.naziv AS naziv_terena
FROM rezervacije r
JOIN korisnik k ON r.sifra_korisnika = k.sifra_korisnika
JOIN Tereni t ON r.sifra_terena = t.sifra_terena
ORDER BY r.datum_iznajmljivanja DESC
  `

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Greška prilikom dohvaćanja rezervacija:', err)
      return res.status(500).json({ message: 'Greška na serveru' })
    }
    res.json(results)
  })
})

/*
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
*/
module.exports = app

if (require.main === module) {
  const port = process.env.PORT || 3000
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
  })
}
