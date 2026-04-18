from typing import Optional, List
from fastapi import FastAPI
from sqlmodel import Field, Session, SQLModel, create_engine, select
import random

class Machine(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True) 
    typed: str
    is_working: bool = True
class Order(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    type_item: str
    count: int
    is_ready: bool = False
    ready_count: int = Field(default=0) # сколько есть
    input_ready: int = Field(default=0) #матерриала
    current_hour: int = 0 

sqlite_url = "sqlite:///factory.db"
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})



SQLModel.metadata.create_all(engine)

app = FastAPI()


@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/addMachine")
def add_user(type2: str):
    with Session(engine) as session:
        new_obj = Machine(typed=type2) 
        session.add(new_obj)
        session.commit()
        session.refresh(new_obj)
        return {"Message": "Станок добавлен"} 
@app.get("/machines", response_model=List[Machine])
def GetUsers():
    with Session(engine) as session:
        st = select(Machine)
        results = session.exec(st).all() 
        return results

@app.post("/create_order")
def create_order(name: str, _count: int):
    with Session(engine) as session:
        old_orders = session.exec(select(Order)).all()
        for o in old_orders: session.delete(o)
        session.commit()
        new_order = Order(type_item=name, count=_count)
        session.add(new_order)
        session.commit()
        session.refresh(new_order)
        return {"message": f"Начинаем производство: {name}", "count": _count}

@app.post("/tick")
def tick():
    with Session(engine) as session:
        order = session.exec(select(Order)).first()
        machines = session.exec(select(Machine)).all()

        if not order:
            return {"error": "Нет активного задания"}
        
        if order.current_hour >= 8:
            return {"status": "Смена окончена", "total": order.ready_count}

        order.current_hour += 1
        log = []

        for m in machines:
            if not m.is_working:
                log.append(f"{m.typed} сломан")
                continue

            if random.random() < 0.05:
                m.is_working = False
                log.append(f"{m.typed} сломался!")
            else:
                order.ready_count += 1
                log.append(f"{m.typed} сделал деталь")

        session.commit()
        session.refresh(order)
        
        return {
            "hour": order.current_hour,
            "progress": f"{order.ready_count}/{order.count}",
            "event": log
        }
@app.post("/repair/{machine_id}")
def repair_machine(machine_id: int):
    with Session(engine) as session:
        machine = session.get(Machine, machine_id)
        if not machine:
            return {"error": "Станок не найден"}
        
        machine.is_working = True
        session.commit()
        return {"message": f"Станок {machine.typed} починен"}
@app.post("/finish_shift")
def finish_shift():
    with Session(engine) as session:
        order = session.exec(select(Order)).first()
        if not order:
            return {"error": "Задание не найдено"}
        
        success = order.ready_count >= order.count
        status = "Вы выполнили заказ" if success else "Вы не выполнили заказ"
        
        message = (f"Вы сделали {order.ready_count} за {order.current_hour} ч.")
        
        return {
            "result": status,
            "message": message,
            "shortfall": max(0, order.count - order.ready_count)
        }