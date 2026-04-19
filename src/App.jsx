import { useState } from 'react'
import './App.css'
import { STATIONS } from './stations.js'
import { MATERIAL_ICONS } from './materialIcons.js'

const NUM_WORKERS = 5
const NUM_TURNS = 15
const GOAL_AUTOS = 1
const getBreakChance = (workers) => {
  if (workers === 1) return 0.0;
  if (workers === 2) return 0.1;
  if (workers === 3) return 0.2;
  if (workers === 4) return 0.5;
  if (workers === 5) return 1.0;
  return 0.05;
};

function App() {
  const [screen, setScreen] = useState('game-start')
  const [plan, setPlan] = useState(Array(NUM_TURNS).fill().map(() => Array(STATIONS.length).fill(0)))
  const [materials, setMaterials] = useState({
    'пластик': 0, 'сталь': 0, 'детали': 0, 'обшивка': 0, 'каркас': 0, 'авто': 0
  })
const [simulationStep, setSimulationStep] = useState(-1)
const [stations, setStations] = useState(STATIONS.map(() => ({ broken: false, idleTurns: 0, brokenTurns: 0 })))
const [result, setResult] = useState('')
  const [score, setScore] = useState(0)
  const [scoreDetails, setScoreDetails] = useState([])
  const [showDetails, setShowDetails] = useState(false)
  const [repairMessage, setRepairMessage] = useState(false)
  const [turnStats, setTurnStats] = useState({})
const [turnPulse, setTurnPulse] = useState(false)
const [workersAvailable, setWorkersAvailable] = useState(NUM_WORKERS)


  const resetGame = () => {
    setScreen('plan')

    setPlan(Array(NUM_TURNS).fill().map(() => Array(STATIONS.length).fill(0)))
    setMaterials({ 'пластик': 0, 'сталь': 0, 'детали': 0, 'обшивка': 0, 'каркас': 0, 'авто': 0 })
    setSimulationStep(0)
  setStations(STATIONS.map(() => ({ broken: false, idleTurns: 0, brokenTurns: 0 })))
    setWorkersAvailable(NUM_WORKERS)
    setScore(0)
    setScoreDetails([])
  }
  const startGame = () => {
    setScreen('tutorial')
  }

  const startPlan = () => {
    setScreen('plan')
  }

  const updatePlan = (turn, stationId, value) => {
    const newPlan = plan.map(row => [...row])
    newPlan[turn][stationId] = Math.max(0, Math.min(workersAvailable, parseInt(value) || 0))
    const total = newPlan[turn].reduce((sum, v) => sum + v, 0)
    if (total > workersAvailable) {
      newPlan[turn][stationId] -= total - workersAvailable
    }
    setPlan(newPlan)
  }

  const startSimulation = () => {
    setMaterials({ 'пластик': 0, 'сталь': 0, 'детали': 0, 'обшивка': 0, 'каркас': 0, 'авто': 0 })
    setStations(STATIONS.map(() => ({ broken: false, idleTurns: 0, brokenTurns: 0 })))
    setSimulationStep(-1)
    setScreen('simulate')
  }

  const nextTurn = () => {
    if (simulationStep < 0) {
      setSimulationStep(0)
      setTurnPulse(true)
      setTimeout(() => setTurnPulse(false), 2000)
      return
    }
    if (simulationStep + 1 >= NUM_TURNS) {
      finishSimulation()
      return
    }

    let newStations = [...stations]
const thisTurnWorkers = plan[simulationStep]
    const inputStocks = { ...materials }
    const newMaterials = { ...materials }

    const repairWorkers = thisTurnWorkers[6]
    if (repairWorkers >= 1) {
      newStations = newStations.map(s => ({ ...s, broken: false }))
      setRepairMessage(true)
      setTimeout(() => setRepairMessage(false), 3000)
    }

   
    STATIONS.forEach((station, id) => {
      if (id === 6) return;
      const workers = thisTurnWorkers[id];
      if (workers > 0 && !newStations[id].broken) { 
        if (Math.random() < getBreakChance(workers)) {
          newStations[id].broken = true;
        }
      }
    });

    const turnProduction = {};
   
    STATIONS.forEach((station, id) => {
      if (id === 6 || thisTurnWorkers[id] === 0 || newStations[id].broken) return;

      const rate = station.rate * thisTurnWorkers[id];
     
      const canProduce = station.inputs.every(inp => inputStocks[inp] >= rate);
      if (canProduce) {
        station.inputs.forEach(inp => newMaterials[inp] -= rate);
        newMaterials[station.output] += rate;
        turnProduction[id] = {
          produced: `${station.output}: +${rate}`,
          consumed: station.inputs.map(inp => `${inp}: -${rate}`).join(', ') || 'расходов нет'
        };
      }
    });
    setMaterials(newMaterials);
    
    newStations.forEach((station, id) => {
      if (id === 6) return;
      const workers = thisTurnWorkers[id];
      
      if (workers > 0 && !newStations[id].broken) {
        
        newStations[id].idleTurns = 0;
        newStations[id].brokenTurns = 0;
      } else if (newStations[id].broken) {
        newStations[id].brokenTurns += 1;
        if (newStations[id].brokenTurns === 3) {
          const penalty = -10;
          setScore(prev => prev + penalty);
          setScoreDetails(prev => [...prev, {type: 'broken', station: id, points: penalty, desc: `Станок ${STATIONS[id].name} сломан 3 хода подряд: ${penalty}`}]);
        }
      } else {
        
        newStations[id].idleTurns += 1;
        if (newStations[id].idleTurns === 5) {
          const penalty = -10;
          setScore(prev => prev + penalty);
          setScoreDetails(prev => [...prev, {type: 'idle', station: id, points: penalty, desc: `Станок ${STATIONS[id].name} простаивал 5 ходов: ${penalty}`}]);
        }
      }
    });
    setStations(newStations);
    setTurnStats(turnProduction);
    setSimulationStep(simulationStep + 1);
    setTurnPulse(true)
    setTimeout(() => setTurnPulse(false), 2000)
  }

  

  const finishSimulation = () => {
    const autos = Math.floor(materials['авто']);
    const orderPoints = autos * 100;
    setScore(prev => prev + orderPoints);
    setScoreDetails(prev => [...prev, {type: 'order', points: orderPoints, desc: `Завершено заказов (${autos} авто): ${orderPoints}`}]);
    
    const success = autos >= GOAL_AUTOS
    setResult(success ? `ПОБЕДА! ${autos} автомобилей собрано!` : `Поражение. Собрано ${autos}/${GOAL_AUTOS} авто.`)
    setScreen('result')
  }

  const getWorkerColor = (count) => {
    const colors = {
      0: { backgroundColor: '#ffffff', color: '#000' },
      1: { backgroundColor: '#00ff00', color: '#000' },
      2: { backgroundColor: '#ff8c00', color: '#000' },
      3: { backgroundColor: '#ff0000', color: '#fff' },
      4: { backgroundColor: '#ff0000', color: '#fff' },
      5: { backgroundColor: '#ff0000', color: '#fff' }
    }
    return colors[count] || colors[5]
  }

  const getCurrentWorkers = () => {
    return plan[simulationStep] || Array(STATIONS.length).fill(0)
  }

  const materialOrder = ['пластик', 'сталь', 'детали', 'обшивка', 'каркас', 'авто']
  const materialLabels = {
    'пластик': 'Пластик',
    'сталь': 'Сталь',
    'детали': 'Детали',
    'обшивка': 'Обшивка',
    'каркас': 'Каркас',
    'авто': 'Авто'
  }

  if (screen === 'game-start') {
    return (
      <div className="app game-start-app">
        <h1 className="production-title">Factory manager</h1>
        <div className="game-start-bg">
          <button className="production-title start-header-button" onClick={startGame}>начать игру</button>
        </div>
      </div>
    )
  }

  if (screen === 'tutorial') {
    return (
      <div className="app tutorial-screen">
        <h1 className="production-title">Обучение</h1>
        <div className="tutorial-content">
          <div className="tutorial-step">
            <h2>Цель: собрать 1 автомобиль за 15 ходов</h2>
            <p>У вас есть пять рабочих на 6 станков, нужно праильно их распределить</p>
          </div>
          <div className="tutorial-step">
            <h2>Риски:</h2>
            <ul>
              <li>Больше рабочих = выше шанс поломки</li>
              <li>Нужно ремонтировать</li>
            </ul>
          </div>
          <div className="tutorial-step">
            <h2>Цеха:</h2>
            <ul>
              <li>Пресс-форма → пластик</li>
              <li>Литейный цех → сталь</li>
              <li>Резчик деталей: пластик + сталь → детали</li>
              <li>Сборщик обшивки: пластик + детали → обшивка</li>
              <li>Сборщик каркасов: сталь + детали → каркас</li>
              <li>Сборщик Авто: детали + обшивка + каркас → авто</li>
              <li>Ремонт: чинит сломанные станки</li>
            </ul>
          </div>
          <button className="start-button" onClick={startPlan}>Понял, начать планирование!</button>
        </div>
      </div>
    )
  }

  if (screen === 'plan') {
    return (
      <div className="app full-plan">
<h1 className="production-title">План производства</h1>

        <div className="gantt-container">
          <div className="table-container">
            <table className="gantt-table">

            <thead>
              <tr>
                <th>Ход</th>
{STATIONS.map((station, id) => (
                <th key={id} title={station.title || station.name}>{station.name}</th>

                ))}
                <th>Итого</th>
              </tr>
            </thead>
            <tbody>
              {plan.map((turnPlan, turn) => (
                <tr key={turn}>
                  <td className="turn-cell">{turn + 1}</td>
{turnPlan.map((w, id) => (
                      <td key={id}>
                        <div className="worker-control" data-turn={turn} data-station={id}>
                          <button 
                            className="steel-button minus" 
                            onClick={() => updatePlan(turn, id, Math.max(0, w - 1))}
                            disabled={w === 0}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="0" max={workersAvailable}
                            value={w}
                            onChange={e => updatePlan(turn, id, e.target.value)}
                            className="worker-input-table"
                            style={{ fontSize: 'clamp(1.4rem, 6vw, 1.8rem)' }}
                          />
                          <button 
                            className="steel-button plus" 
                            onClick={() => {
                              const newVal = Math.min(5, w + 1);
                              updatePlan(turn, id, newVal);
                            }}
                          >
                            +
                          </button>
                        </div>
                      </td>
                    ))}
                  <td className="total-cell">{turnPlan.reduce((a,b) => a + b, 0)}</td>
                </tr>
              ))}

            </tbody>
          </table>
          </div>
        </div>
        <div className="button-area">
          <div className="simulate-start-btn">
  <button className="simulate-button" onClick={startSimulation} style={{background: 'radial-gradient(circle, #000080 0%, #000066 70%, #00004d 100%)', borderColor: '#0000aa'}}>Start</button>
</div>
        </div>





      </div>
    )
  }

  if (screen === 'simulate') {
    const currentWorkers = getCurrentWorkers()
    return (
      <div className="app simulate-screen">
        <div className="materials-bar">
          {materialOrder.map(m => (
            <div key={m} className="material-item">
              <img src={MATERIAL_ICONS[m]} alt={m} className="material-icon" />
              <span>{materialLabels[m]}: {Math.floor(materials[m])}</span>
            </div>
          ))}
        </div>

        <div className={`deadline-circle ${turnPulse ? 'pulse-start' : ''}`}>
          {simulationStep + 1}/{NUM_TURNS}
        </div>

        {repairMessage && (
          <div className="repair-notification">
            Ремонт!
          </div>
        )}

        <div className="factory-bg">
  <div className="stations-overlays">
    {STATIONS.slice(0, -1).map((station, id) => (
      <div key={id} className="station-overlay">
        {station.img && (
          <img src={station.img} alt={station.name} className="station-img" loading="lazy" />
        )}
        <div className="worker-badge" style={getWorkerColor(currentWorkers[id])}>
          {currentWorkers[id]}
        </div>
        <div className={`station-status ${stations[id].broken ? 'broken' : ''}`}>
          {stations[id].broken ? 'СЛОМАН' : 'ОК'}
        </div>
        {turnStats[id] && (
          <div className="turn-stat">
            <div className="produced-badge">+{turnStats[id].produced}</div>
            <div className="consumed-badge">{turnStats[id].consumed}</div>
          </div>
        )}
      </div>
    ))}
  </div>
</div>

        <div className="next-turn-button" onClick={nextTurn}>
          Следующий ход
        </div>
      </div>
    )
  }


  if (screen === 'result') {
    return (
      <div className="app">
        <h1 className="production-title">{result}</h1>
        <div className="score-display">
          <div className="score-value">Итоговые баллы: {score}</div>
        </div>
        <button className="details-button" onClick={() => setShowDetails(true)}>Подробнее</button>
        <button className="start-button" onClick={resetGame}>Новая игра</button>
        
        {showDetails && (
          <div className="details-modal">
            <div className="modal-content">
              <h3>Детализация баллов:</h3>
              <ul className="score-list">
                {scoreDetails.map((detail, index) => (
                  <li key={index} className={`score-item ${detail.points >= 0 ? 'positive' : 'negative'}`}>
                    {detail.desc}
                  </li>
                ))}
              </ul>
              <div className="total-score">Всего: {score}</div>
              <button className="close-modal" onClick={() => setShowDetails(false)}>Закрыть</button>
            </div>
          </div>
        )}
      </div>
    )
  }
}

export default App

