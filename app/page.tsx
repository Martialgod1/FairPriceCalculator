'use client';

import { useState, useEffect } from 'react';

interface Composition {
  element: string;
  min_value: number;
  max_value: number;
  average_value: number;
}

interface MaterialGrade {
  grade: string;
  compositions: Composition[];
}

export default function Home() {
  const [baseDate, setBaseDate] = useState('');
  const [fairPriceDate, setFairPriceDate] = useState('');
  const [baseConversionRate, setBaseConversionRate] = useState('');
  const [fairPriceConversionRate, setFairPriceConversionRate] = useState('');
  const [baseRate, setBaseRate] = useState('');
  const [additionalExpenses, setAdditionalExpenses] = useState('');
  const [error, setError] = useState('');
  const [materialGrades, setMaterialGrades] = useState<MaterialGrade[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [materialsData, setMaterialsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMaterialGrades();
  }, []);

  const fetchMaterialGrades = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8000/material-grades');
      if (!response.ok) {
        throw new Error('Failed to fetch material grades');
      }
      const data = await response.json();
      setMaterialGrades(data.grades);
      if (data.grades.length > 0) {
        setSelectedGrade(data.grades[0].grade);
        updateMaterialsData(data.grades[0]);
      }
    } catch (error) {
      console.error('Error fetching material grades:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch material grades');
    } finally {
      setIsLoading(false);
    }
  };

  const updateMaterialsData = (grade: MaterialGrade) => {
    const newMaterialsData = grade.compositions.map(comp => ({
      material: comp.element,
      percentageComposition: comp.average_value.toFixed(2),
      priceUSD: "0.00",
      priceINR: "0.00",
      fairPriceUSD: "0.00",
      fairPriceINR: "0.00"
    }));
    setMaterialsData(newMaterialsData);
  };

  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedGradeName = e.target.value;
    setSelectedGrade(selectedGradeName);
    const grade = materialGrades.find(g => g.grade === selectedGradeName);
    if (grade) {
      updateMaterialsData(grade);
    }
  };

  const fetchConversionRate = async (date: string, isBaseDate: boolean) => {
    try {
      console.log(`Fetching conversion rate for date: ${date}`);
      const response = await fetch(`http://localhost:8000/conversion-rates/${date}`);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch conversion rate');
      }
      
      const data = await response.json();
      console.log('Received data:', data);
      
      if (isBaseDate) {
        setBaseConversionRate(data.rate.toFixed(4));
      } else {
        setFairPriceConversionRate(data.rate.toFixed(4));
      }
      setError('');
    } catch (error) {
      console.error('Error fetching conversion rate:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch conversion rate');
      if (isBaseDate) {
        setBaseConversionRate('');
      } else {
        setFairPriceConversionRate('');
      }
    }
  };

  const handleBaseDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    console.log('Base date changed to:', date);
    setBaseDate(date);
    if (date) {
      fetchConversionRate(date, true);
    } else {
      setBaseConversionRate('');
    }
  };

  const handleFairPriceDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    console.log('Fair price date changed to:', date);
    setFairPriceDate(date);
    if (date) {
      fetchConversionRate(date, false);
    } else {
      setFairPriceConversionRate('');
    }
  };

  // Calculate totals for INR columns
  const totalBaseINR = materialsData.reduce((sum, item) => sum + parseFloat(item.priceINR), 0).toFixed(1);
  const totalFairPriceINR = materialsData.reduce((sum, item) => sum + parseFloat(item.fairPriceINR), 0).toFixed(1);

  // Calculate fair price and differences
  const calculateFairPrice = () => {
    if (!baseRate || !totalFairPriceINR) return null;
    const baseRateNum = parseFloat(baseRate);
    const fairPriceNum = parseFloat(totalFairPriceINR);
    const additionalExpensesNum = parseFloat(additionalExpenses) || 0;
    const finalFairPrice = fairPriceNum + additionalExpensesNum;
    const difference = finalFairPrice - baseRateNum;
    const percentageChange = (difference / baseRateNum) * 100;
    
    return {
      materialsFairPrice: fairPriceNum.toFixed(2),
      finalFairPrice: finalFairPrice.toFixed(2),
      difference: difference.toFixed(2),
      percentageChange: percentageChange.toFixed(2)
    };
  };

  const calculations = calculateFairPrice();

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-white">
            Fair Price Calculator
          </h1>
          <p className="mt-2 text-blue-100">
            Calculate fair prices for different steel grades based on their compositions
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-8">
          {/* Grade Selection and Summary Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="w-full md:w-1/3">
                <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Steel Grade
                </label>
                <div className="relative">
                  <select
                    id="grade"
                    name="grade"
                    value={selectedGrade}
                    onChange={handleGradeChange}
                    disabled={isLoading}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {isLoading ? (
                      <option>Loading grades...</option>
                    ) : (
                      materialGrades.map((grade) => (
                        <option key={grade.grade} value={grade.grade}>
                          {grade.grade}
                        </option>
                      ))
                    )}
                  </select>
                  {isLoading && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedGrade && (
                <div className="w-full md:w-2/3 bg-blue-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    {selectedGrade} Composition Summary
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {materialsData.map((item, index) => (
                      <div key={index} className="bg-white rounded p-2 shadow-sm">
                        <p className="text-sm font-medium text-gray-900">{item.material}</p>
                        <p className="text-sm text-gray-600">{item.percentageComposition}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Date and Rate Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
                <h2 className="text-lg font-semibold text-blue-900">Date Information</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Date
                    </label>
                    <input
                      type="date"
                      value={baseDate}
                      onChange={handleBaseDateChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Date Conversion Rate
                    </label>
                    <input
                      type="text"
                      value={baseConversionRate}
                      readOnly
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-50"
                      placeholder="0.0000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fair Price Date
                    </label>
                    <input
                      type="date"
                      value={fairPriceDate}
                      onChange={handleFairPriceDateChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fair Price Conversion Rate
                    </label>
                    <input
                      type="text"
                      value={fairPriceConversionRate}
                      readOnly
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-50"
                      placeholder="0.0000"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
                <h2 className="text-lg font-semibold text-blue-900">Rate Information</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Rate (INR)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₹</span>
                      </div>
                      <input
                        type="number"
                        value={baseRate}
                        onChange={(e) => setBaseRate(e.target.value)}
                        className="block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Expenses (INR)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₹</span>
                      </div>
                      <input
                        type="number"
                        value={additionalExpenses}
                        onChange={(e) => setAdditionalExpenses(e.target.value)}
                        className="block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Materials Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
              <h2 className="text-lg font-semibold text-blue-900">Material Compositions and Prices</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Material
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Composition (%)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price (USD)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price (INR)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fair Price (USD)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fair Price (INR)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {materialsData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.material}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.percentageComposition}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${item.priceUSD}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{item.priceINR}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${item.fairPriceUSD}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{item.fairPriceINR}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Calculations Section */}
          {calculations && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
                <h2 className="text-lg font-semibold text-blue-900">Price Calculations</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Base Rate</h3>
                    <p className="text-2xl font-semibold text-gray-900">
                      ₹{baseRate || '0.00'}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Materials Fair Price</h3>
                    <p className="text-2xl font-semibold text-gray-900">
                      ₹{calculations.materialsFairPrice}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Difference</h3>
                    <p className={`text-2xl font-semibold ${parseFloat(calculations.difference) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{calculations.difference}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Percentage Change</h3>
                    <p className={`text-2xl font-semibold ${parseFloat(calculations.percentageChange) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {calculations.percentageChange}%
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Final Fair Price</h3>
                    <p className="text-2xl font-semibold text-gray-900">
                      ₹{calculations.finalFairPrice}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 