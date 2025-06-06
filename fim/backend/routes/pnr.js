const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

const router = express.Router();

// Get all PNR groups with deadline information
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        pd.pnr_id,
        pd.pnr,
        pd.group_code,
        pd.first_departure,
        pd.deadline_1,
        pd.deadline_2,
        pd.issue_date,
        COUNT(f.id) as flight_count,
        SUM(f.fare + f.yq_tax) as total_fare,
        SUM(f.seats * f.deposit) as total_deposit
      FROM pnr_deadlines pd
      JOIN flights f ON pd.pnr_id = f.pnr_id
      GROUP BY pd.pnr_id, pd.pnr, pd.group_code, pd.first_departure, pd.deadline_1, pd.deadline_2, pd.issue_date
      ORDER BY pd.first_departure
    `);

    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('Error fetching PNR data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch PNR data'
    });
  }
});

// Get specific PNR with all flights
router.get('/:pnr', async (req, res) => {
  try {
    const { pnr } = req.params;
    
    // Get PNR group info
    const [pnrInfo] = await db.execute(`
      SELECT 
        pd.pnr_id,
        pd.pnr,
        pd.group_code,
        pd.first_departure,
        pd.deadline_1,
        pd.deadline_2,
        pd.issue_date
      FROM pnr_deadlines pd
      WHERE pd.pnr = ?
    `, [pnr]);

    if (pnrInfo.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'PNR not found'
      });
    }

    // Get all flights for this PNR
    const [flights] = await db.execute(`
      SELECT 
        f.id,
        f.flight_number,
        f.departure_date,
        f.route,
        f.time_schedule as time,
        f.seats,
        f.fare,
        f.yq_tax as yq,
        f.deposit,
        f.push_to_market as pushToMarket,
        f.flight_order,
        (f.fare + f.yq_tax) as totalFare
      FROM flights f
      WHERE f.pnr_id = ?
      ORDER BY f.flight_order
    `, [pnrInfo[0].pnr_id]);

    res.json({
      success: true,
      data: {
        pnr: pnrInfo[0],
        flights: flights
      }
    });
  } catch (error) {
    console.error('Error fetching PNR details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch PNR details'
    });
  }
});

// Create new PNR group
router.post('/', [
  body('pnr').notEmpty().withMessage('PNR is required'),
  body('groupCode').notEmpty().withMessage('Group code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { pnr, groupCode } = req.body;

    // Check if PNR already exists
    const [existing] = await db.execute(
      'SELECT id FROM pnr_groups WHERE pnr = ?',
      [pnr]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'PNR already exists'
      });
    }

    // Create new PNR group
    const [result] = await db.execute(
      'INSERT INTO pnr_groups (pnr, group_code) VALUES (?, ?)',
      [pnr, groupCode]
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        pnr: pnr,
        groupCode: groupCode,
        message: 'PNR group created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating PNR group:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create PNR group'
    });
  }
});

// Update PNR group
router.put('/:pnr', [
  body('groupCode').optional().notEmpty().withMessage('Group code cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { pnr } = req.params;
    const { groupCode } = req.body;

    const [result] = await db.execute(
      'UPDATE pnr_groups SET group_code = ? WHERE pnr = ?',
      [groupCode, pnr]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'PNR not found'
      });
    }

    res.json({
      success: true,
      message: 'PNR group updated successfully'
    });
  } catch (error) {
    console.error('Error updating PNR group:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update PNR group'
    });
  }
});

// Delete PNR group (and all associated flights)
router.delete('/:pnr', async (req, res) => {
  try {
    const { pnr } = req.params;
    
    const [result] = await db.execute('DELETE FROM pnr_groups WHERE pnr = ?', [pnr]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'PNR not found'
      });
    }

    res.json({
      success: true,
      message: 'PNR group and all associated flights deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting PNR group:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete PNR group'
    });
  }
});

// Get summary statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const [summary] = await db.execute(`
      SELECT 
        COUNT(DISTINCT pg.id) as total_pnrs,
        COUNT(f.id) as total_flights,
        SUM(f.seats) as total_seats,
        SUM(f.fare + f.yq_tax) as total_revenue,
        SUM(f.seats * f.deposit) as total_deposits,
        AVG(f.fare + f.yq_tax) as avg_fare
      FROM pnr_groups pg
      LEFT JOIN flights f ON pg.id = f.pnr_id
    `);

    const [upcoming] = await db.execute(`
      SELECT COUNT(*) as upcoming_flights
      FROM flights f
      WHERE f.departure_date > CURDATE()
    `);

    res.json({
      success: true,
      data: {
        ...summary[0],
        upcoming_flights: upcoming[0].upcoming_flights
      }
    });
  } catch (error) {
    console.error('Error fetching summary stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch summary statistics'
    });
  }
});

module.exports = router; 