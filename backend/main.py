from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import Dict, List
from pydantic import BaseModel
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Response models
class ConversionRateResponse(BaseModel):
    date: str
    rate: float

class Composition(BaseModel):
    element: str
    min_value: float
    max_value: float
    average_value: float

class MaterialGrade(BaseModel):
    grade: str
    compositions: List[Composition]

class MaterialGradeResponse(BaseModel):
    grades: List[MaterialGrade]

# Hardcoded conversion rates (to be replaced with SQL database later)
CONVERSION_RATES = {
    "2025-05-20": 80.35,
    "2025-05-21": 80.9,
    "2025-05-22": 83.2,
    "2025-05-23": 81.23,
    "2025-05-24": 82.1, 
    "2025-05-25": 84.2
}

MATERIAL_GRADES = [
    MaterialGrade(
        grade="Carbon Steel",
        compositions=[
            Composition(element="Carbon", min_value=0.05, max_value=2.0, average_value=1.025),
            Composition(element="Manganese", min_value=0.3, max_value=1.5, average_value=0.9),
            Composition(element="Silicon", min_value=0.1, max_value=0.4, average_value=0.25)
        ]
    ),
    MaterialGrade(
        grade="Alloy Steel",
        compositions=[
            Composition(element="Chromium", min_value=0.5, max_value=1.5, average_value=1.0),
            Composition(element="Nickel", min_value=0.5, max_value=3.0, average_value=1.75),
            Composition(element="Molybdenum", min_value=0.1, max_value=0.5, average_value=0.3)
        ]
    ),
    MaterialGrade(
        grade="Stainless Steel",
        compositions=[
            Composition(element="Chromium", min_value=10.5, max_value=30.0, average_value=20.25),
            Composition(element="Nickel", min_value=8.0, max_value=20.0, average_value=14.0),
            Composition(element="Molybdenum", min_value=0.0, max_value=7.0, average_value=3.5)
        ]
    ),
    MaterialGrade(
        grade="Tool Steel",
        compositions=[
            Composition(element="Carbon", min_value=0.5, max_value=1.5, average_value=1.0),
            Composition(element="Chromium", min_value=4.0, max_value=5.0, average_value=4.5),
            Composition(element="Vanadium", min_value=0.1, max_value=2.0, average_value=1.05)
        ]
    ),
    MaterialGrade(
        grade="High-Speed Steel",
        compositions=[
            Composition(element="Tungsten", min_value=5.0, max_value=20.0, average_value=12.5),
            Composition(element="Molybdenum", min_value=3.0, max_value=10.0, average_value=6.5),
            Composition(element="Chromium", min_value=3.0, max_value=5.0, average_value=4.0)
        ]
    ),
    MaterialGrade(
        grade="Maraging Steel",
        compositions=[
            Composition(element="Nickel", min_value=15.0, max_value=25.0, average_value=20.0),
            Composition(element="Cobalt", min_value=4.0, max_value=10.0, average_value=7.0),
            Composition(element="Molybdenum", min_value=0.2, max_value=5.0, average_value=2.6)
        ]
    ),
    MaterialGrade(
        grade="Weathering Steel",
        compositions=[
            Composition(element="Copper", min_value=0.25, max_value=0.75, average_value=0.5),
            Composition(element="Chromium", min_value=0.5, max_value=1.0, average_value=0.75),
            Composition(element="Nickel", min_value=0.3, max_value=0.5, average_value=0.4)
        ]
    ),
    MaterialGrade(
        grade="Spring Steel",
        compositions=[
            Composition(element="Carbon", min_value=0.5, max_value=1.0, average_value=0.75),
            Composition(element="Manganese", min_value=0.5, max_value=1.0, average_value=0.75),
            Composition(element="Silicon", min_value=0.1, max_value=0.4, average_value=0.25)
        ]
    )
]

@app.get("/")
async def root():
    return {"message": "Welcome to Fair Price Calculator API"}

@app.get("/conversion-rates/{date}", response_model=ConversionRateResponse)
async def get_conversion_rate(date: str) -> ConversionRateResponse:
    try:
        logger.info(f"Received request for date: {date}")
        # Validate date format
        datetime.strptime(date, "%Y-%m-%d")
        
        # Get rate from hardcoded data (will be replaced with SQL query later)
        rate = CONVERSION_RATES.get(date)
        logger.info(f"Found rate for {date}: {rate}")
        
        if rate is None:
            logger.warning(f"No rate found for date: {date}")
            raise HTTPException(status_code=404, detail="Conversion rate not found for the given date")
            
        return ConversionRateResponse(date=date, rate=rate)
        
    except ValueError:
        logger.error(f"Invalid date format: {date}")
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

@app.get("/material-grades", response_model=MaterialGradeResponse)
async def get_material_grades() -> MaterialGradeResponse:
    """
    Get all available material grades and their compositions
    """
    return MaterialGradeResponse(grades=MATERIAL_GRADES)

@app.get("/material-grades/{grade}", response_model=MaterialGrade)
async def get_material_grade(grade: str) -> MaterialGrade:
    """
    Get specific material grade and its compositions
    """
    for material_grade in MATERIAL_GRADES:
        if material_grade.grade == grade:
            return material_grade
    raise HTTPException(status_code=404, detail=f"Material grade {grade} not found") 