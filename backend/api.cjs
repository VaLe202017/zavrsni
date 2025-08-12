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
/*******************************************************************/
//provjera sesije
app.get('/api/check', (req, res) => {
  if (req.session.korisnik) {
    res.json({ loggedIn: true, korisnik: req.session.user })
  } else {
    res.json({ loggedIn: false })
  }
})
/*******************************************************************/
//api za login
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
/*******************************************************************/
//pretraga artikala
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
/*******************************************************************/
//unos narudzbe
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
/*******************************************************************/
//logout zatvaranje sesije
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: 'Greška pri odjavi' })
    res.clearCookie('connect.sid') // naziv ovisi o session configu
    res.json({ message: 'Odjava uspješna' })
  })
})
/*******************************************************************/
//registracija korisnika
app.post('/api/register', (req, res) => {
  const { ime_korisnika, prezime_korisnika, broj_telefona_korisnika, email_korisnika, password } =
    req.body
  const sql =
    'INSERT INTO korisnik (ime_korisnika, prezime_korisnika, broj_telefona_korisnika, email_korisnika, password) VALUES (?, ?, ?, ?, ?)'
  const values = [
    ime_korisnika,
    prezime_korisnika,
    broj_telefona_korisnika,
    email_korisnika,
    password,
  ]

  connection.query(sql, values, (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    req.session.korisnik = {
      sifra_korisnika: result.insertId,
      email_korisnika,
    }
    res.status(201).json({
      success: true,
      id: result.insertId,
      ime_korisnika,
      prezime_korisnika,
      broj_telefona_korisnika,
      email_korisnika,
      password,
    })
  })
})
/*******************************************************************/
//dodavanje korisnika
app.post('/api/korisnik', (req, res) => {
  const { ime_korisnika, prezime_korisnika, broj_telefona_korisnika, email_korisnika, password } =
    req.body
  const sql =
    'INSERT INTO korisnik (ime_korisnika, prezime_korisnika, broj_telefona_korisnika, email_korisnika, password) VALUES (?, ?, ?, ?, ?)'
  const values = [
    ime_korisnika,
    prezime_korisnika,
    broj_telefona_korisnika,
    email_korisnika,
    password,
  ]

  connection.query(sql, values, (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    res.status(201).json({
      success: true,
      id: result.insertId,
      ime_korisnika,
      prezime_korisnika,
      broj_telefona_korisnika,
      email_korisnika,
      password,
    })
  })
})
/*******************************************************************/
//dohvacanje svih korisnika
app.get('/api/svi-korisnici', (req, res) => {
  const sql = 'SELECT * FROM korisnik'
  connection.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Greška kod dohvaćanja korisnika' })
    res.status(200).json(results)
  })
})
/*******************************************************************/
//azuriranje korisnika
app.put('/api/korisnik/:id', (req, res) => {
  const { id } = req.params
  const { ime_korisnika, prezime_korisnika, broj_telefona_korisnika, email_korisnika, password } =
    req.body

  const sql = `
    UPDATE korisnik
    SET ime_korisnika = ?, prezime_korisnika = ?, broj_telefona_korisnika = ?, email_korisnika = ?, password = ?
    WHERE sifra_korisnika = ?
  `

  connection.query(
    sql,
    [ime_korisnika, prezime_korisnika, broj_telefona_korisnika, email_korisnika, password, id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Greška kod ažuriranja korisnika' })
      res.status(200).json({ message: 'Korisnik ažuriran' })
    },
  )
})
/*******************************************************************/
//brisanje korisnika
app.delete('/api/korisnik/:id', (req, res) => {
  const { id } = req.params
  const sql = 'DELETE FROM korisnik WHERE sifra_korisnika = ?'
  connection.query(sql, [id], (err) => {
    if (err) return res.status(500).json({ error: 'Greška kod brisanja korisnika' })
    res.status(200).json({ message: 'Korisnik obrisan' })
  })
})
/*******************************************************************/
//dodavanje artikla
app.post('/api/artikl', (req, res) => {
  const { naziv_artikla, dostupna_kolicina, cijena_dan, sifra_tipa_artikla, sifra_lokacije } =
    req.body
  const sql =
    'INSERT INTO artikli (naziv_artikla, dostupna_kolicina, cijena_dan, sifra_tipa_artikla, sifra_lokacije) VALUES (?, ?, ?, ?, ?)'
  const values = [naziv_artikla, dostupna_kolicina, cijena_dan, sifra_tipa_artikla, sifra_lokacije]

  connection.query(sql, values, (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    res.status(201).json({
      success: true,
      id: result.insertId,
      naziv_artikla,
      dostupna_kolicina,
      cijena_dan,
      sifra_tipa_artikla,
      sifra_lokacije,
    })
  })
})
/*******************************************************************/
//složeni upit za sve artikle
app.get('/api/svi-artikli', (req, res) => {
  const sql = `SELECT
      art.sifra_artikla,
      art.naziv_artikla,
      art.dostupna_kolicina,
      art.cijena_dan,
      lok.sifra_lokacije,
      lok.naziv_lokacije,
      lok.adresa_lokacije,
      tip.sifra_tipa_artikla,
      tip.tip_artikla
    FROM artikli art
    JOIN lokacije lok ON lok.sifra_lokacije = art.sifra_lokacije
    JOIN tip_artikla tip ON tip.sifra_tipa_artikla=art.sifra_tipa_artikla`
  connection.query(sql, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    res.status(200).json(results)
  })
})
/*******************************************************************/
//azuriranje artika
app.put('/api/artikl/:id', (req, res) => {
  const { id } = req.params
  const { naziv_artikla, dostupna_kolicina, cijena_dan, sifra_lokacije, sifra_tipa_artikla } =
    req.body

  const sql = `
    UPDATE artikli
    SET naziv_artikla = ?, dostupna_kolicina = ?, cijena_dan = ?, sifra_lokacije = ?, sifra_tipa_artikla = ?
    WHERE sifra_artikla = ?
  `

  connection.query(
    sql,
    [naziv_artikla, dostupna_kolicina, cijena_dan, sifra_lokacije, sifra_tipa_artikla, id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Greška kod ažuriranja artikla' })
      res.status(200).json({ message: 'Artikl ažuriran' })
    },
  )
})
/*******************************************************************/
//brisanje artikla
app.delete('/api/artikl/:id', (req, res) => {
  const { id } = req.params
  const sql = 'DELETE FROM artikli WHERE sifra_artikla = ?'
  connection.query(sql, [id], (err) => {
    if (err) return res.status(500).json({ error: 'Greška kod brisanja artikla' })
    res.status(200).json({ message: 'Artikl obrisan' })
  })
})
/*******************************************************************/
//azuriranje artika
app.put('/api/artikl/:id', (req, res) => {
  const { id } = req.params
  const { naziv_artikla, dostupna_kolicina, cijena_dan, sifra_lokacije, sifra_tipa_artikla } =
    req.body

  const sql = `
    UPDATE artikli
    SET naziv_artikla = ?, dostupna_kolicina = ?, cijena_dan = ?, sifra_lokacije = ?, sifra_tipa_artikla = ?
    WHERE sifra_artikla = ?
  `

  connection.query(
    sql,
    [naziv_artikla, dostupna_kolicina, cijena_dan, sifra_lokacije, sifra_tipa_artikla, id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Greška kod ažuriranja artikla' })
      res.status(200).json({ message: 'Artikl ažuriran' })
    },
  )
})
/*******************************************************************/
//brisanje artikla
app.delete('/api/artikl/:id', (req, res) => {
  const { id } = req.params
  const sql = 'DELETE FROM artikli WHERE sifra_artikla = ?'
  connection.query(sql, [id], (err) => {
    if (err) return res.status(500).json({ error: 'Greška kod brisanja artikla' })
    res.status(200).json({ message: 'Artikl obrisan' })
  })
})
/*******************************************************************/
//dohvat tipova artikla
app.get('/api/tipovi-artikla', (req, res) => {
  const sql = 'SELECT sifra_tipa_artikla, tip_artikla FROM tip_artikla'
  connection.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Greška kod dohvaćanja tipova artikla' })
    res.json(results)
  })
})
/*******************************************************************/
//dodavanje tipa artikla
app.post('/api/tip-artikla', (req, res) => {
  const { tip_artikla } = req.body
  const sql = 'INSERT INTO tip_artikla (tip_artikla) VALUES (?)'
  const values = [tip_artikla]

  connection.query(sql, values, (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    res.status(201).json({
      success: true,
      id: result.insertId,
      tip_artikla,
    })
  })
})
/*******************************************************************/
//azuriranje tipa artika
app.put('/api/tip-artikla/:id', (req, res) => {
  const { id } = req.params
  const { tip_artikla } = req.body

  const sql = `
    UPDATE tip_artikla
    SET tip_artikla=?
    WHERE sifra_tipa_artikla = ?
  `

  connection.query(sql, [tip_artikla, id], (err) => {
    if (err) return res.status(500).json({ error: 'Greška kod ažuriranja tipa artikla' })
    res.status(200).json({ message: 'Tip artikla ažuriran' })
  })
})
/*******************************************************************/
//brisanje artikla
app.delete('/api/tip-artikla/:id', (req, res) => {
  const { id } = req.params
  const sql = 'DELETE FROM tip_artikla WHERE sifra_tipa_artikla = ?'
  connection.query(sql, [id], (err) => {
    if (err) return res.status(500).json({ error: 'Greška kod brisanja tipa artikla' })
    res.status(200).json({ message: 'Tip artikla obrisan' })
  })
})
/*******************************************************************/
//dohvat lokacije
app.get('/api/lokacije', (req, res) => {
  const sql =
    'SELECT sifra_lokacije, naziv_lokacije, adresa_lokacije FROM lokacije ORDER BY naziv_lokacije ASC'
  connection.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Greška kod dohvaćanja lokacija' })
    res.json(results)
  })
})
/*******************************************************************/
//dohvat lokacija za admin
app.get('/api/sve-lokacije', (req, res) => {
  const sql =
    'SELECT sifra_lokacije, naziv_lokacije, adresa_lokacije, grad, drzava FROM lokacije ORDER BY naziv_lokacije ASC'
  connection.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Greška kod dohvaćanja lokacija' })
    res.json(results)
  })
})
/*******************************************************************/
//dodavanje lokacija
app.post('/api/lokacija', (req, res) => {
  const { naziv_lokacije, adresa_lokacije, grad, drzava } = req.body

  if (!naziv_lokacije || !adresa_lokacije || !grad || !drzava) {
    return res.status(400).json({ error: 'Sva polja su obavezna' })
  }

  const sql = `
    INSERT INTO lokacije (naziv_lokacije, adresa_lokacije, grad, drzava)
    VALUES (?, ?, ?, ?)
  `
  connection.query(sql, [naziv_lokacije, adresa_lokacije, grad, drzava], (err, result) => {
    if (err) {
      console.error('Greška kod dodavanja lokacije:', err)
      return res.status(500).json({ error: 'Greška kod dodavanja lokacije' })
    }
    res.status(201).json({
      success: true,
      sifra_lokacije: result.insertId,
      naziv_lokacije,
      adresa_lokacije,
      grad,
      drzava,
    })
  })
})
/*******************************************************************/
//ažuriranje lokacija
app.put('/api/lokacija/:id', (req, res) => {
  const { id } = req.params
  const { naziv_lokacije, adresa_lokacije, grad, drzava } = req.body

  if (!naziv_lokacije || !adresa_lokacije || !grad || !drzava) {
    return res.status(400).json({ error: 'Sva polja su obavezna' })
  }

  const sql = `
    UPDATE lokacije
    SET naziv_lokacije = ?, adresa_lokacije = ?, grad = ?, drzava = ?
    WHERE sifra_lokacije = ?
  `
  connection.query(sql, [naziv_lokacije, adresa_lokacije, grad, drzava, id], (err, result) => {
    if (err) {
      console.error('Greška kod ažuriranja lokacije:', err)
      return res.status(500).json({ error: 'Greška kod ažuriranja lokacije' })
    }
    // result.affectedRows može biti 0 ako ne postoji ID
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Lokacija nije pronađena' })
    }
    res.status(200).json({ success: true, message: 'Lokacija ažurirana' })
  })
})
/*******************************************************************/
//brisanje lokacije
app.delete('/api/lokacija/:id', (req, res) => {
  const { id } = req.params
  const sql = 'DELETE FROM lokacije WHERE sifra_lokacije = ?'

  connection.query(sql, [id], (err, result) => {
    if (err) {
      // FK constraint (npr. postoje artikli koji referenciraju ovu lokaciju)
      // MySQL/MariaDB error code: ER_ROW_IS_REFERENCED_2 (1451)
      if (err.errno === 1451) {
        return res.status(409).json({
          error: 'Lokaciju nije moguće obrisati jer je povezana s artiklima ili drugim zapisima.',
        })
      }
      console.error('Greška kod brisanja lokacije:', err)
      return res.status(500).json({ error: 'Greška kod brisanja lokacije' })
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Lokacija nije pronađena' })
    }
    res.status(200).json({ success: true, message: 'Lokacija obrisana' })
  })
})
/*******************************************************************/
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
/*******************************************************************/
module.exports = app
if (require.main === module) {
  const port = process.env.PORT || 3000
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
  })
}
