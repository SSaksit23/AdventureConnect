const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

const router = express.Router();

// Get all flights with PNR information
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        f.id,
        pg.group_code,
        pg.pnr,
        f.departure_date,
        f.flight_number,
        f.time_schedule as time,
        f.route,
        f.seats,
        f.fare,
        f.yq_tax as yq,
        f.deposit,
        f.push_to_market as pushToMarket,
        f.flight_order,
        (f.fare + f.yq_tax) as totalFare,
        (f.seats * f.deposit) as totalDeposit
      FROM flights f
      JOIN pnr_groups pg ON f.pnr_id = pg.id
      ORDER BY pg.pnr, f.flight_order
    `);

    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('Error fetching flights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch flight data'
    });
  }
});

// Get flights by PNR
router.get('/pnr/:pnr', async (req, res) => {
  try {
    const { pnr } = req.params;
    
    const [rows] = await db.execute(`
      SELECT 
        f.id,
        pg.group_code,
        pg.pnr,
        f.departure_date,
        f.flight_number,
        f.time_schedule as time,
        f.route,
        f.seats,
        f.fare,
        f.yq_tax as yq,
        f.deposit,
        f.push_to_market as pushToMarket,
        f.flight_order
      FROM flights f
      JOIN pnr_groups pg ON f.pnr_id = pg.id
      WHERE pg.pnr = ?
      ORDER BY f.flight_order
    `, [pnr]);

    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('Error fetching flights by PNR:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch flight data'
    });
  }
});

// Create new flight
router.post('/', [
  body('groupCode').notEmpty().withMessage('Group code is required'),
  body('pnr').notEmpty().withMessage('PNR is required'),
  body('flightNumber').notEmpty().withMessage('Flight number is required'),
  body('departureDate').isDate().withMessage('Valid departure date is required'),
  body('seats').isInt({ min: 1 }).withMessage('Seats must be a positive integer'),
  body('fare').isFloat({ min: 0 }).withMessage('Fare must be a positive number'),
  body('yq').isFloat({ min: 0 }).withMessage('YQ/Tax must be a positive number'),
  body('deposit').isFloat({ min: 0 }).withMessage('Deposit must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      groupCode,
      pnr,
      flightNumber,
      departureDate,
      route,
      time,
      seats,
      fare,
      yq,
      deposit,
      pushToMarket,
      flightOrder
    } = req.body;

    // Get or create PNR group
    let [pnrResult] = await db.execute(
      'SELECT id FROM pnr_groups WHERE pnr = ?',
      [pnr]
    );

    let pnrId;
    if (pnrResult.length === 0) {
      const [insertResult] = await db.execute(
        'INSERT INTO pnr_groups (pnr, group_code) VALUES (?, ?)',
        [pnr, groupCode]
      );
      pnrId = insertResult.insertId;
    } else {
      pnrId = pnrResult[0].id;
    }

    // Insert flight
    const [flightResult] = await db.execute(`
      INSERT INTO flights 
      (pnr_id, flight_number, departure_date, route, time_schedule, seats, fare, yq_tax, deposit, push_to_market, flight_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [pnrId, flightNumber, departureDate, route, time, seats, fare, yq, deposit, pushToMarket, flightOrder || 1]);

    res.status(201).json({
      success: true,
      data: {
        id: flightResult.insertId,
        message: 'Flight created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating flight:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create flight'
    });
  }
});

// Update flight
router.put('/:id', [
  body('seats').optional().isInt({ min: 1 }).withMessage('Seats must be a positive integer'),
  body('fare').optional().isFloat({ min: 0 }).withMessage('Fare must be a positive number'),
  body('yq').optional().isFloat({ min: 0 }).withMessage('YQ/Tax must be a positive number'),
  body('deposit').optional().isFloat({ min: 0 }).withMessage('Deposit must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateFields = req.body;

    // Build dynamic update query
    const fields = Object.keys(updateFields);
    const values = Object.values(updateFields);
    
    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    const [result] = await db.execute(
      `UPDATE flights SET ${setClause} WHERE id = ?`,
      [...values, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Flight not found'
      });
    }

    res.json({
      success: true,
      message: 'Flight updated successfully'
    });
  } catch (error) {
    console.error('Error updating flight:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update flight'
    });
  }
});

// Delete flight
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await db.execute('DELETE FROM flights WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Flight not found'
      });
    }

    res.json({
      success: true,
      message: 'Flight deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting flight:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete flight'
    });
  }
});

// Update flight from Amadeus API (mock)
router.post('/:id/amadeus-update', async (req, res) => {
  try {
    const { id } = req.params;
    const { flightNumber, departureDate } = req.body;

    // Mock Amadeus API response
    const mockAmadeusData = {
      'CZ3036': { route: 'BKK-CAN', time: '03.00-07.00' },
      'CZ6900': { route: 'CAN-URC', time: '09.05-14.15' },
      'AF165': { route: 'BKK-CDG', time: '11.30-17.45' },
      'UA838': { route: 'BKK-LAX', time: '14.20-10.30+1' }
    };

    const flightData = mockAmadeusData[flightNumber] || {
      route: 'UNKNOWN',
      time: 'TBA'
    };

    // Update flight with Amadeus data
    const [result] = await db.execute(
      'UPDATE flights SET route = ?, time_schedule = ? WHERE id = ?',
      [flightData.route, flightData.time, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Flight not found'
      });
    }

    res.json({
      success: true,
      data: flightData,
      message: 'Flight updated with Amadeus data'
    });
  } catch (error) {
    console.error('Error updating from Amadeus:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update from Amadeus'
    });
  }
});

module.exports = router; 