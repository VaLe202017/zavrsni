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
/*app.get('/api/check', (req, res) => {
  if (req.session.korisnik) {
    res.json({ loggedIn: true, korisnik: req.session.user })
  } else {
    res.json({ loggedIn: false })
  }
})*/
app.get('/api/check', (req, res) => {
  if (req.session.korisnik) {
    return res.json({ loggedIn: true, role: 'user', korisnik: req.session.korisnik })
  }
  res.json({ loggedIn: false })
})
app.get('/api/admin/check', (req, res) => {
  res.json({ authenticated: !!req.session.admin })
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
  const nacinPlacanja = req.body.nacin_placanja
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
//dohvati narudzbe
app.get('/api/narudzbe', (req, res) => {
  const sql = `
    SELECT
      n.sifra_narudzbe,
      n.sifra_korisnika,
      k.ime_korisnika,
      k.prezime_korisnika,
      k.email_korisnika,
      n.sifra_lokacije,
      l.naziv_lokacije,
      l.adresa_lokacije,
      n.datum_iznajmljivanja,
      n.datum_vracanja,
      n.ukupan_iznos,
      p.nacin_placanja
    FROM narudzbe n
    JOIN korisnik k ON k.sifra_korisnika = n.sifra_korisnika
    JOIN lokacije l ON l.sifra_lokacije = n.sifra_lokacije
    LEFT JOIN placanja p ON p.sifra_narudzbe = n.sifra_narudzbe
    ORDER BY n.sifra_narudzbe DESC
  `
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Greška kod dohvaćanja narudžbi:', err)
      return res.status(500).json({ error: 'Greška kod dohvaćanja narudžbi' })
    }
    res.status(200).json(results)
  })
})
/*******************************************************************/
//dodavanje narudzbe
app.post('/api/narudzba', (req, res) => {
  const {
    sifra_korisnika,
    sifra_lokacije,
    datum_iznajmljivanja,
    datum_vracanja,
    ukupan_iznos,
    nacin_placanja, // opcionalno
  } = req.body

  if (
    !sifra_korisnika ||
    !sifra_lokacije ||
    !datum_iznajmljivanja ||
    !datum_vracanja ||
    ukupan_iznos == null
  ) {
    return res
      .status(400)
      .json({ error: 'sifra_korisnika, sifra_lokacije, datumi i ukupan_iznos su obavezni' })
  }

  const sqlNar = `
    INSERT INTO narudzbe (sifra_korisnika, sifra_lokacije, datum_iznajmljivanja, datum_vracanja, ukupan_iznos)
    VALUES (?, ?, ?, ?, ?)
  `
  connection.query(
    sqlNar,
    [sifra_korisnika, sifra_lokacije, datum_iznajmljivanja, datum_vracanja, ukupan_iznos],
    (err, result) => {
      if (err) {
        console.error('Greška kod dodavanja narudžbe:', err)
        return res.status(500).json({ error: 'Greška kod dodavanja narudžbe' })
      }
      const narudzbaId = result.insertId

      if (!nacin_placanja) {
        return res.status(201).json({ success: true, sifra_narudzbe: narudzbaId })
      }

      const sqlPlac = `INSERT INTO placanja (sifra_narudzbe, nacin_placanja) VALUES (?, ?)`
      connection.query(sqlPlac, [narudzbaId, nacin_placanja], (err2) => {
        if (err2) {
          console.error('Greška kod dodavanja plaćanja:', err2)
          return res
            .status(500)
            .json({ error: 'Narudžba spremljena, ali greška kod spremanja plaćanja' })
        }
        res.status(201).json({ success: true, sifra_narudzbe: narudzbaId })
      })
    },
  )
})
/*******************************************************************/
//azuriranje narudzbe
app.put('/api/narudzba/:id', (req, res) => {
  const { id } = req.params
  const {
    sifra_korisnika, // možeš dozvoliti edit ili ignorirati (ovdje je dozvoljeno)
    sifra_lokacije,
    datum_iznajmljivanja,
    datum_vracanja,
    ukupan_iznos,
    nacin_placanja, // opcionalno; upsert u placanja
  } = req.body

  const sqlUpd = `
    UPDATE narudzbe
    SET
      sifra_korisnika = ?,
      sifra_lokacije = ?,
      datum_iznajmljivanja = ?,
      datum_vracanja = ?,
      ukupan_iznos = ?
    WHERE sifra_narudzbe = ?
  `
  connection.query(
    sqlUpd,
    [sifra_korisnika, sifra_lokacije, datum_iznajmljivanja, datum_vracanja, ukupan_iznos, id],
    (err, result) => {
      if (err) {
        console.error('Greška kod ažuriranja narudžbe:', err)
        return res.status(500).json({ error: 'Greška kod ažuriranja narudžbe' })
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Narudžba nije pronađena' })
      }

      if (!nacin_placanja) {
        return res.status(200).json({ success: true, message: 'Narudžba ažurirana' })
      }

      // upsert u placanja
      const sqlCheck = `SELECT 1 FROM placanja WHERE sifra_narudzbe = ? LIMIT 1`
      connection.query(sqlCheck, [id], (err2, row) => {
        if (err2) {
          console.error('Greška pri provjeri plaćanja:', err2)
          return res.status(500).json({ error: 'Greška pri ažuriranju načina plaćanja' })
        }
        if (row.length > 0) {
          const sqlUpdP = `UPDATE placanja SET nacin_placanja = ? WHERE sifra_narudzbe = ?`
          connection.query(sqlUpdP, [nacin_placanja, id], (err3) => {
            if (err3) {
              console.error('Greška kod ažuriranja plaćanja:', err3)
              return res.status(500).json({ error: 'Greška kod ažuriranja načina plaćanja' })
            }
            res.status(200).json({ success: true, message: 'Narudžba i plaćanje ažurirani' })
          })
        } else {
          const sqlInsP = `INSERT INTO placanja (sifra_narudzbe, nacin_placanja) VALUES (?, ?)`
          connection.query(sqlInsP, [id, nacin_placanja], (err4) => {
            if (err4) {
              console.error('Greška kod dodavanja plaćanja:', err4)
              return res.status(500).json({ error: 'Greška kod spremanja načina plaćanja' })
            }
            res.status(200).json({ success: true, message: 'Narudžba ažurirana i plaćanje dodano' })
          })
        }
      })
    },
  )
})
/*******************************************************************/
//brisanje narudzbe
app.delete('/api/narudzba/:id', (req, res) => {
  const { id } = req.params

  const delPlac = `DELETE FROM placanja WHERE sifra_narudzbe = ?`
  connection.query(delPlac, [id], (err) => {
    if (err) {
      console.error('Greška kod brisanja plaćanja:', err)
      return res.status(500).json({ error: 'Greška kod brisanja plaćanja' })
    }
    const delNar = `DELETE FROM narudzbe WHERE sifra_narudzbe = ?`
    connection.query(delNar, [id], (err2, result2) => {
      if (err2) {
        console.error('Greška kod brisanja narudžbe:', err2)
        return res.status(500).json({ error: 'Greška kod brisanja narudžbe' })
      }
      if (result2.affectedRows === 0) {
        return res.status(404).json({ error: 'Narudžba nije pronađena' })
      }
      res.status(200).json({ success: true, message: 'Narudžba obrisana' })
    })
  })
})
/*******************************************************************/
//admin login
app.post('/api/admin', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: 'Korisničko ime i lozinka su obavezni' })
  }

  const sql = 'SELECT * FROM Admin WHERE username = ? AND password = ? LIMIT 1'
  connection.query(sql, [username, password], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Greška na serveru' })
    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: 'Neispravni podaci' })
    }
    const admin = rows[0]
    req.session.admin = { id: admin.id, username: admin.username }
    res.json({ success: true, admin: { id: admin.id, username: admin.username } })
  })
})
/*******************************************************************/
//potreban admin?
function isAdmin(req, res, next) {
  if (req.session && req.session.admin) return next()
  return res.status(401).json({ error: 'Admin autorizacija je potrebna' })
}
/*******************************************************************/
module.exports = app
if (require.main === module) {
  const port = process.env.PORT || 3000
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
  })
}
/*******************************************************************/
//dodavanje inicijalnih stavki kroz kosaricu
app.post('/api/stavke-narudzbe', (req, res) => {
  if (!req.session?.korisnik) {
    return res.status(401).json({ error: 'Niste prijavljeni' })
  }
  const korisnikId = req.session.korisnik.sifra_korisnika

  // prihvati camelCase i snake_case iz frontenda
  const nacinPlacanja = req.body.nacinPlacanja ?? req.body.nacin_placanja ?? 'Gotovina'
  const datumIznajmljivanja = req.body.datumIznajmljivanja ?? req.body.datum_iznajmljivanja
  const datumVracanja = req.body.datumVracanja ?? req.body.datum_vracanja
  const sifra_lokacije = req.body.sifraLokacije ?? req.body.sifra_lokacije
  const ukupanIznos = Number(req.body.ukupnaCijena ?? req.body.ukupan_iznos ?? 0)
  const stavkeRaw = req.body.stavke

  if (!datumIznajmljivanja || !datumVracanja || !sifra_lokacije) {
    return res.status(400).json({ error: 'Nedostaju datumi ili lokacija' })
  }
  if (!Array.isArray(stavkeRaw) || stavkeRaw.length === 0) {
    return res.status(400).json({ error: 'Košarica je prazna' })
  }

  // normaliziraj stavke
  const stavke = stavkeRaw
    .map((s) => ({
      sifra_artikla: Number(s.sifra_artikla),
      kolicina: Number(s.kolicina || 1),
    }))
    .filter((s) => Number.isFinite(s.sifra_artikla) && s.kolicina > 0)

  if (stavke.length === 0) {
    return res.status(400).json({ error: 'Neispravne stavke (fali sifra_artikla/kolicina)' })
  }

  // agregiraj količine po artiklu (radi provjere + update zaliha)
  const kolicinePoArtiklu = new Map()
  for (const s of stavke) {
    kolicinePoArtiklu.set(
      s.sifra_artikla,
      (kolicinePoArtiklu.get(s.sifra_artikla) || 0) + s.kolicina,
    )
  }
  const artiklIds = Array.from(kolicinePoArtiklu.keys())

  connection.getConnection((err, conn) => {
    if (err) return res.status(500).json({ error: 'DB konekcija nije dostupna' })

    const fail = (e, msg = 'Greška pri spremanju narudžbe') =>
      conn.rollback(() => {
        conn.release()
        console.error('ROLLBACK /api/narudzba-komplet:', e)
        res.status(500).json({ error: msg })
      })

    conn.beginTransaction((e1) => {
      if (e1) {
        conn.release()
        return res.status(500).json({ error: 'Transakcija nije mogla krenuti' })
      }

      // 1) Insert narudžbe
      const sqlNar = `
        INSERT INTO narudzbe (sifra_korisnika, sifra_lokacije, datum_iznajmljivanja, datum_vracanja, ukupan_iznos)
        VALUES (?, ?, ?, ?, ?)
      `
      conn.query(
        sqlNar,
        [korisnikId, sifra_lokacije, datumIznajmljivanja, datumVracanja, ukupanIznos],
        (eNar, rNar) => {
          if (eNar) return fail(eNar, 'Greška kod dodavanja narudžbe')
          const narudzbaId = rNar.insertId

          // 2) Insert plaćanja (uvijek insert; nacinPlacanja nikad NULL)
          const sqlPlac = 'INSERT INTO placanja (sifra_narudzbe, nacin_placanja) VALUES (?, ?)'
          conn.query(sqlPlac, [narudzbaId, nacinPlacanja || 'Gotovina'], (ePlac) => {
            if (ePlac) return fail(ePlac, 'Greška kod dodavanja plaćanja')

            // 3) Provjera zaliha
            const sqlArt = `
            SELECT sifra_artikla, dostupna_kolicina
            FROM artikli
            WHERE sifra_artikla IN (${artiklIds.map(() => '?').join(',')})
          `
            conn.query(sqlArt, artiklIds, (eArt, rowsArt) => {
              if (eArt) return fail(eArt, 'Greška pri provjeri artikala')

              const byId = new Map(rowsArt.map((r) => [r.sifra_artikla, r]))
              for (const [aid, kol] of kolicinePoArtiklu.entries()) {
                const r = byId.get(aid)
                if (!r) {
                  // 409 = Conflict → artikl ne postoji
                  return conn.rollback(() => {
                    conn.release()
                    return res.status(409).json({ error: `Artikl ne postoji: ${aid}` })
                  })
                }
                if (Number(r.dostupna_kolicina) < Number(kol)) {
                  return conn.rollback(() => {
                    conn.release()
                    return res
                      .status(409)
                      .json({ error: `Nema dovoljno na zalihi za artikl ${aid}` })
                  })
                }
              }

              // 4) INSERT stavki (eksplodirano po količini)
              const rows = []
              for (const [aid, kol] of kolicinePoArtiklu.entries()) {
                for (let i = 0; i < kol; i++) rows.push([narudzbaId, aid])
              }

              conn.query(
                'INSERT INTO stavke_narudzbe (sifra_narudzbe, sifra_artikla) VALUES ?',
                [rows],
                (eStav) => {
                  if (eStav) return fail(eStav, 'Greška pri spremanju stavki')

                  // 5) Smanji zalihe
                  const updatePromises = []
                  for (const [aid, kol] of kolicinePoArtiklu.entries()) {
                    updatePromises.push(
                      new Promise((resolve, reject) => {
                        conn.query(
                          'UPDATE artikli SET dostupna_kolicina = dostupna_kolicina - ? WHERE sifra_artikla = ?',
                          [kol, aid],
                          (eUpd) => (eUpd ? reject(eUpd) : resolve()),
                        )
                      }),
                    )
                  }

                  Promise.all(updatePromises)
                    .then(() => {
                      conn.commit((eC) => {
                        if (eC) return fail(eC)
                        conn.release()
                        res.status(201).json({ success: true, sifra_narudzbe: narudzbaId })
                      })
                    })
                    .catch((eU) => fail(eU, 'Greška pri ažuriranju zaliha'))
                },
              )
            })
          })
        },
      )
    })
  })
})
/*******************************************************************/
//dodavanje stavki kroz admin sucelje
app.post('/api/stavke-narudzbe-dodaj', isAdmin, (req, res) => {
  const { sifra_narudzbe, stavke } = req.body

  const narId = Number(sifra_narudzbe)
  if (!Number.isFinite(narId)) {
    return res.status(400).json({ error: 'Neispravan sifra_narudzbe' })
  }
  if (!Array.isArray(stavke) || stavke.length === 0) {
    return res.status(400).json({ error: 'Pošalji stavke kao niz {sifra_artikla, kolicina}' })
  }

  const norm = stavke
    .map((s) => ({
      sifra_artikla: Number(s.sifra_artikla),
      kolicina: Number(s.kolicina || 1),
    }))
    .filter((s) => Number.isFinite(s.sifra_artikla) && s.kolicina > 0)

  if (norm.length === 0) {
    return res.status(400).json({ error: 'Neispravne stavke (fali sifra_artikla/kolicina)' })
  }

  const kolicinePoArtiklu = new Map()
  for (const s of norm) {
    kolicinePoArtiklu.set(
      s.sifra_artikla,
      (kolicinePoArtiklu.get(s.sifra_artikla) || 0) + s.kolicina,
    )
  }
  const artiklIds = Array.from(kolicinePoArtiklu.keys())

  connection.getConnection((err, conn) => {
    if (err) return res.status(500).json({ error: 'DB konekcija nije dostupna' })

    const rollback = (e, msg = 'Greška pri dodavanju stavki') =>
      conn.rollback(() => {
        conn.release()
        console.error('ROLLBACK /api/stavke-narudzbe-dodaj:', e)
        res.status(500).json({ error: msg })
      })

    conn.beginTransaction((e1) => {
      if (e1) {
        conn.release()
        return res.status(500).json({ error: 'Transakcija nije mogla krenuti' })
      }

      conn.query(
        `SELECT datum_iznajmljivanja, datum_vracanja, ukupan_iznos
         FROM narudzbe WHERE sifra_narudzbe = ? LIMIT 1`,
        [narId],
        (eNar, rNar) => {
          if (eNar) return rollback(eNar, 'Greška pri provjeri narudžbe')
          if (rNar.length === 0)
            return rollback(new Error('Narudžba ne postoji'), 'Narudžba ne postoji')

          const nar = rNar[0]
          const start = new Date(nar.datum_iznajmljivanja)
          const end = new Date(nar.datum_vracanja)
          const diff = Math.round((end - start) / (1000 * 60 * 60 * 24))
          const brojDana = Math.max(1, diff)

          const sqlArt = `
            SELECT sifra_artikla, dostupna_kolicina, cijena_dan
            FROM artikli
            WHERE sifra_artikla IN (${artiklIds.map(() => '?').join(',')})
          `
          conn.query(sqlArt, artiklIds, (eArt, rowsArt) => {
            if (eArt) return rollback(eArt, 'Greška pri provjeri artikala')

            const byId = new Map(rowsArt.map((r) => [r.sifra_artikla, r]))
            for (const [aid, kol] of kolicinePoArtiklu.entries()) {
              const r = byId.get(aid)
              if (!r)
                return rollback(new Error(`Artikl ne postoji: ${aid}`), `Artikl ne postoji: ${aid}`)
              if (Number(r.dostupna_kolicina) < Number(kol)) {
                return rollback(
                  new Error(`Nema zalihe za artikl ${aid}`),
                  `Nema zalihe za artikl ${aid}`,
                )
              }
            }

            const rows = []
            for (const [aid, kol] of kolicinePoArtiklu.entries()) {
              for (let i = 0; i < kol; i++) rows.push([narId, aid])
            }

            conn.query(
              'INSERT INTO stavke_narudzbe (sifra_narudzbe, sifra_artikla) VALUES ?',
              [rows],
              (eIns) => {
                if (eIns) return rollback(eIns, 'Greška pri spremanju stavki')

                const updates = []
                for (const [aid, kol] of kolicinePoArtiklu.entries()) {
                  updates.push(
                    new Promise((resolve, reject) => {
                      conn.query(
                        'UPDATE artikli SET dostupna_kolicina = dostupna_kolicina - ? WHERE sifra_artikla = ?',
                        [kol, aid],
                        (eUpd) => (eUpd ? reject(eUpd) : resolve()),
                      )
                    }),
                  )
                }

                Promise.all(updates)
                  .then(() => {
                    let dodatak = 0
                    for (const [aid, kol] of kolicinePoArtiklu.entries()) {
                      const cij = Number(byId.get(aid).cijena_dan || 0)
                      dodatak += cij * kol
                    }
                    dodatak = dodatak * brojDana

                    conn.query(
                      'UPDATE narudzbe SET ukupan_iznos = ukupan_iznos + ? WHERE sifra_narudzbe = ?',
                      [dodatak, narId],
                      (eTot) => {
                        if (eTot) return rollback(eTot, 'Greška pri ažuriranju iznosa')
                        conn.commit((eC) => {
                          if (eC) return rollback(eC)
                          conn.release()
                          res.status(201).json({
                            success: true,
                            sifra_narudzbe: narId,
                            dodano_redaka: rows.length,
                            dodatak_ukupan_iznos: dodatak,
                          })
                        })
                      },
                    )
                  })
                  .catch((eU) => rollback(eU, 'Greška pri ažuriranju zaliha'))
              },
            )
          })
        },
      )
    })
  })
})
/*******************************************************************/
//brisanje stavki krozu admin sucelje
app.delete('/api/stavka-narudzbe/:id', (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Neispravan ID' })

  connection.getConnection((err, conn) => {
    if (err) return res.status(500).json({ error: 'DB konekcija nije dostupna' })

    const rollback = (e, msg = 'Greška') =>
      conn.rollback(() => {
        conn.release()
        res.status(500).json({ error: msg })
      })

    conn.beginTransaction((e1) => {
      if (e1) {
        conn.release()
        return res.status(500).json({ error: 'Transakcija nije mogla krenuti' })
      }

      conn.query(
        'SELECT sifra_artikla FROM stavke_narudzbe WHERE sifra_artikla_narudzbe = ?',
        [id],
        (eSel, rows) => {
          if (eSel) return rollback(eSel, 'Greška pri čitanju stavke')
          if (rows.length === 0) {
            conn.rollback(() => {
              conn.release()
              return res.status(404).json({ error: 'Stavka ne postoji' })
            })
            return
          }
          const sifraArt = rows[0].sifra_artikla

          conn.query(
            'DELETE FROM stavke_narudzbe WHERE sifra_artikla_narudzbe = ?',
            [id],
            (eDel) => {
              if (eDel) return rollback(eDel, 'Greška pri brisanju stavke')
              conn.query(
                'UPDATE artikli SET dostupna_kolicina = dostupna_kolicina + 1 WHERE sifra_artikla = ?',
                [sifraArt],
                (eUpd) => {
                  if (eUpd) return rollback(eUpd, 'Greška pri vraćanju zalihe')
                  conn.commit((eC) => {
                    if (eC) return rollback(eC)
                    conn.release()
                    res.status(200).json({ success: true })
                  })
                },
              )
            },
          )
        },
      )
    })
  })
})
/*******************************************************************/
//ucitavanje stavki po narudzbi
app.get('/api/stavke-narudzbe/:id', (req, res) => {
  const { id } = req.params
  const sql = `
    SELECT sn.sifra_artikla_narudzbe, sn.sifra_narudzbe, sn.sifra_artikla,
           a.naziv_artikla, a.cijena_dan
    FROM stavke_narudzbe sn
    JOIN artikli a ON a.sifra_artikla = sn.sifra_artikla
    WHERE sn.sifra_narudzbe = ?
    ORDER BY sn.sifra_artikla_narudzbe
  `
  connection.query(sql, [id], (err, rows) => {
    if (err) {
      console.error('Greška dohvat stavki:', err)
      return res.status(500).json({ error: 'Greška pri dohvaćanju stavki' })
    }
    res.status(200).json(rows)
  })
})
/*******************************************************************/
//azuriranje samo cijene
app.put('/api/cijena-narudzbe/:id', (req, res) => {
  const { id } = req.params
  const { ukupan_iznos } = req.body

  const sqlUpd = `
    UPDATE narudzbe
    SET
      ukupan_iznos = ?
    WHERE sifra_narudzbe = ?
  `
  connection.query(sqlUpd, [ukupan_iznos, id], (err, result) => {
    if (err) {
      console.error('Greška kod ažuriranja narudžbe:', err)
      return res.status(500).json({ error: 'Greška kod ažuriranja narudžbe' })
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Narudžba nije pronađena' })
    }
  })
})
/*******************************************************************/
// ucitavanje uplata
app.get(
  '/api/uplate',
  /* isAdmin, */ (req, res) => {
    const sql = `
    SELECT
      p.sifra_narudzbe,
      p.nacin_placanja,
      p.status_placanja,
      n.ukupan_iznos,
      n.datum_iznajmljivanja,
      n.datum_vracanja,
      k.ime_korisnika,
      k.prezime_korisnika,
      k.email_korisnika
    FROM placanja p
    JOIN narudzbe n ON n.sifra_narudzbe = p.sifra_narudzbe
    JOIN korisnik k ON k.sifra_korisnika = n.sifra_korisnika
    ORDER BY p.sifra_narudzbe DESC
  `
    connection.query(sql, (err, rows) => {
      if (err) {
        console.error('Greška dohvat uplata:', err)
        return res.status(500).json({ error: 'Greška pri dohvaćanju uplata' })
      }
      res.json(rows)
    })
  },
)
/*******************************************************************/
// dodavanje uplate
app.post(
  '/api/uplata',
  /* isAdmin, */ (req, res) => {
    const { sifra_narudzbe, nacin_placanja, status_placanja } = req.body
    if (!sifra_narudzbe || !nacin_placanja) {
      return res.status(400).json({ error: 'sifra_narudzbe i nacin_placanja su obavezni' })
    }
    const status = Number(status_placanja ? 1 : 0)

    const qIns =
      'INSERT INTO placanja (sifra_narudzbe, nacin_placanja, status_placanja) VALUES (?, ?)'
    connection.query(qIns, [sifra_narudzbe, nacin_placanja, status], (e3) => {
      if (e3) return res.status(500).json({ error: 'Greška pri dodavanju uplate' })
      res.status(201).json({ success: true, upsert: 'inserted' })
    })
  },
)
/*******************************************************************/
//azuriranje uplate
app.put(
  '/api/uplata/:sifraNar',
  /* isAdmin, */ (req, res) => {
    const sifraNar = Number(req.params.sifraNar)
    const { nacin_placanja, status_placanja } = req.body
    if (!Number.isFinite(sifraNar) || !nacin_placanja) {
      return res.status(400).json({ error: 'Neispravan zahtjev' })
    }
    const sql = 'UPDATE placanja SET nacin_placanja = ?, status_placanja=? WHERE sifra_narudzbe = ?'
    connection.query(sql, [nacin_placanja, status_placanja, sifraNar], (err, result) => {
      if (err) return res.status(500).json({ error: 'Greška pri spremanju' })
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Uplata nije pronađena' })
      res.json({ success: true })
    })
  },
)
/*******************************************************************/
//brisanje uplate
app.delete(
  '/api/uplata/:sifraNar',
  /* isAdmin, */ (req, res) => {
    const sifraNar = Number(req.params.sifraNar)
    if (!Number.isFinite(sifraNar)) {
      return res.status(400).json({ error: 'Neispravan ID' })
    }
    const sql = 'DELETE FROM placanja WHERE sifra_narudzbe = ?'
    connection.query(sql, [sifraNar], (err, result) => {
      if (err) return res.status(500).json({ error: 'Greška pri brisanju' })
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Uplata nije pronađena' })
      res.json({ success: true })
    })
  },
)
