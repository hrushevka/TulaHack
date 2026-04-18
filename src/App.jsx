import { useState } from 'react'
import './App.css'
import { STATIONS } from './stations.js'
import { MATERIAL_ICONS } from './materialIcons.js'

const NUM_WORKERS = 5
const NUM_TURNS = 15
const GOAL_AUTOS = 10
const BREAK_CHANCE = 0.05

function App() {
  const [screen, setScreen] = useState('start')
  const [plan, setPlan] = useState(Array(NUM_TURNS).fill().map(() => Array(STATIONS.length).fill(0)))
  const [materials, setMaterials] = useState({
    'пластик': 0, 'сталь': 0, 'детали': 0, 'обшивка': 0, 'каркас': 0, 'авто': 0
  })
  const [simulationStep, setSimulationStep] = useState(0)
  const [stations, setStations] = useState(STATIONS.map(() => ({ broken: false })))
  const [result, setResult] = useState('')

  const resetGame = () => {
    setScreen('start')
    setPlan(Array(NUM_TURNS).fill().map(() => Array(STATIONS.length).fill(0)))
    setMaterials({ 'пластик': 0, 'сталь': 0, 'детали': 0, 'обшивка': 0, 'каркас': 0, 'авто': 0 })
    setSimulationStep(0)
    setStations(STATIONS.map(() => ({ broken: false })))
  }

  const startGame = () => {
    setScreen('plan')
  }

  const updatePlan = (turn, stationId, value) => {
    const newPlan = plan.map(row => [...row])
    newPlan[turn][stationId] = Math.max(0, Math.min(NUM_WORKERS, parseInt(value) || 0))
    const total = newPlan[turn].reduce((sum, v) => sum + v, 0)
    if (total > NUM_WORKERS) {
      newPlan[turn][stationId] -= total - NUM_WORKERS
    }
    setPlan(newPlan)
  }

  const startSimulation = () => {
    setMaterials({ 'пластик': 0, 'сталь': 0, 'детали': 0, 'обшивка': 0, 'каркас': 0, 'авто': 0 })
    setStations(STATIONS.map(() => ({ broken: false })))
    setSimulationStep(0)
    setScreen('simulate')
  }

  const nextTurn = () => {
    if (simulationStep + 1 >= NUM_TURNS) {
      finishSimulation()
      return
    }

    const thisTurnWorkers = plan[simulationStep]
    const newStations = [...stations]
    const inputStocks = { ...materials } // снимок запасов НАЧАЛО ХОДА
    const newMaterials = { ...materials } // производство для следующего хода

    STATIONS.forEach((station, id) => {
      const workers = thisTurnWorkers[id]
      if (workers === 0 || newStations[id].broken) return

      if (Math.random() < BREAK_CHANCE) {
        newStations[id].broken = true
        return
      }

      // Проверяем входные материалы из снимка НАЧАЛА ХОДА
      const canProduce = station.inputs.every(input => (inputStocks[input] || 0) >= workers)
      if (!canProduce) return

      // Потребляем из снимка, производим в newMaterials
      station.inputs.forEach(input => {
        newMaterials[input] -= workers * station.rate
      })
      newMaterials[station.output] += workers * station.rate
    })

    setMaterials(newMaterials)
    setStations(newStations)
    setSimulationStep(simulationStep + 1)
  }

  const finishSimulation = () => {
    const success = materials['авто'] >= GOAL_AUTOS
    setResult(success ? `ПОБЕДА! ${Math.floor(materials['авто'])} автомобилей собрано!` : `Поражение. Собрано ${Math.floor(materials['авто'])}/${GOAL_AUTOS} авто.`)
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
    'пластик': 'Пластиковые заготовки',
    'сталь': 'Стальные заготовки',
    'детали': 'Детали',
    'обшивка': 'Обшивка',
    'каркас': 'Каркасы',
    'авто': 'Автомобили'
  }

  if (screen === 'start') {
    return (
      <div className="app">
        <h1>Factorio Manager</h1>
        <button className="start-button" onClick={startGame}>Начать</button>
      </div>
    )
  }

  if (screen === 'plan') {
    return (
      <div className="app full-plan">
        <h1>План производства (рабочие по станкам)</h1>
        <div className="gantt-container">
          <table className="gantt-table">
            <thead>
              <tr>
                <th>Ход</th>
{STATIONS.map((station, id) => (
                  <th key={id} title={station.name}>{station.name}</th>
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
                          min="0" max="5"
                          value={w}
                          onChange={e => updatePlan(turn, id, e.target.value)}
                          className="worker-input-table"
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
        <button className="simulate-button" onClick={startSimulation}>Запустить симуляцию</button>
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
              <img src={MATERIAL_ICONS[m]} alt={m} className="material-icon" style={{width: '32px', height: '32px'}} />
              <span>{materialLabels[m]}: {Math.floor(materials[m])}</span>
            </div>
          ))}
        </div>

        <div className="deadline-circle">
          Ход {simulationStep + 1} из {NUM_TURNS}
        </div>

        <div className="factory-bg">
          <div className="stations-overlays">
            {STATIONS.map((station, id) => (
              <div key={id} className="station-overlay">
                {station.img && (
                  <img src={station.img} alt={station.name} className="station-img" />
                )}
                <div className="worker-badge" style={getWorkerColor(currentWorkers[id])}>
                  {currentWorkers[id]}
                </div>
                <div className={`station-status ${stations[id].broken ? 'broken' : ''}`}>
                  {stations[id].broken ? 'СЛОМАН' : 'OK'}
                </div>
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
        <h1>{result}</h1>
        <button className="start-button" onClick={resetGame}>Новая игра</button>
      </div>
    )
  }
}

export default App

