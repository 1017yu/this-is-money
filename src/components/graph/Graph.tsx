import React, { useState, useEffect, useRef } from 'react';
import { Collapse } from 'antd';
import Chart from 'chart.js/auto';
import { expenseSummary } from '@/lib/api/Api';

interface ExpenseItem {
  _id: string;
  totalAmount: number;
}

function getWeeksInMonth(year: number, month: number): string[][] {
  const weeks: string[][] = [];

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  let currentWeek: string[] = [];
  let currentDate = firstDay;

  while (currentDate <= lastDay) {
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
    currentWeek.push(dateStr);

    if (currentDate.getDay() === 6 || currentDate === lastDay) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}

function getOrdinalWeek(index: number): string {
  const ordinalNumbers = ['첫째', '둘째', '셋째', '넷째', '다섯째', '여섯째'];
  return ordinalNumbers[index] || '';
}

function App() {
  const [expenseData, setExpenseData] = useState<ExpenseItem[]>([]);
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const chartRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    updateCharts();
  }, [selectedYear, selectedMonth, expenseData]);

  const fetchData = async () => {
    try {
      const data = await expenseSummary('daily');
      setExpenseData(data);
    } catch (error) {
      console.error('Failed to fetch expense data:', error);
    }
  };

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedYear(Number(event.target.value));
  };

  const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedMonth(Number(event.target.value));
  };

  const handlePreviousMonth = (): void => {
    if (selectedMonth === 1) {
      setSelectedYear((prevYear) => prevYear - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth((prevMonth) => prevMonth - 1);
    }
  };

  const handleNextMonth = (): void => {
    if (selectedMonth === 12) {
      setSelectedYear((prevYear) => prevYear + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth((prevMonth) => prevMonth + 1);
    }
  };

  const updateCharts = () => {
    chartRefs.current.forEach((chartRef, index) => {
      if (chartRef) {
        const ctx = chartRef.getContext('2d');
        if (ctx) {
          const weeksInMonth = getWeeksInMonth(selectedYear, selectedMonth);
          if (weeksInMonth[index]) {
            const week = weeksInMonth[index];
            const weekTitle = index === 0 ? '첫째 주' : `${getOrdinalWeek(index)} 주`;
            let existingChart = Chart.getChart(chartRef);
            if (existingChart) {
              existingChart.data.labels = week.map((date) => date.split('-')[2]);
              existingChart.data.datasets[0].data = week.map((date) => {
                const expenseItem = expenseData.find((item) => item._id === date);
                return expenseItem ? expenseItem.totalAmount : 0;
              });
              existingChart.update();
            } else {
              existingChart = new Chart(ctx, {
                type: 'bar',
                data: {
                  labels: week.map((date) => date.split('-')[2]),
                  datasets: [
                    {
                      label: `${weekTitle} 그래프`,
                      data: week.map((date) => {
                        const expenseItem = expenseData.find((item) => item._id === date);
                        return expenseItem ? expenseItem.totalAmount : 0;
                      }),
                      backgroundColor: 'rgba(75, 192, 192, 0.2)',
                      borderColor: 'rgba(75, 192, 192, 1)',
                      borderWidth: 1,
                    },
                  ],
                },
                options: {
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                },
              });
            }
          }
        }
      }
    });
  };

  const renderMonthGraph = (year: number, month: number) => {
    const weeksInMonth = getWeeksInMonth(year, month);

    const weekData = weeksInMonth.map((week, index) => {
      const weekTitle = index === 0 ? '첫째 주' : `${getOrdinalWeek(index)} 주`;

      const weekExpense = week.reduce((total, date) => {
        const expenseItem = expenseData.find((item) => item._id === date);
        const totalAmount = expenseItem ? expenseItem.totalAmount : 0;
        return total + totalAmount;
      }, 0);

      const startDay = Number(week[0].split('-')[2]);
      const endDay = Number(week[week.length - 1].split('-')[2]);

      return {
        title: weekTitle,
        period: `${month}월 ${startDay}일 - ${month}월 ${endDay}일`,
        totalExpense: weekExpense,
      };
    });

    return (
      <Collapse defaultActiveKey={[]} onChange={updateCharts}>
        {weekData.map((week, index) => (
          <Collapse.Panel key={index} header={week.title} showArrow={false} forceRender style={{ cursor: 'pointer', fontWeight: 'bold' }}>
            <ul>
              <li>{`${week.period}`}</li>
              <li>{`총 금액: ${week.totalExpense} 원`}</li>
            </ul>
            <div>
              <canvas
                id={`chart-${index}`}
                ref={(el) => {
                  if (el) {
                    chartRefs.current[index] = el;
                  }
                }}
              />
            </div>
          </Collapse.Panel>
        ))}
      </Collapse>
    );
  };

  const years = [];
  for (let i = 2022; i <= 2099; i++) {
    years.push(
      <option key={i} value={i}>
        {i}년
      </option>
    );
  }

  const months = [];
  for (let i = 1; i <= 12; i++) {
    months.push(
      <option key={i} value={i}>
        {i}월
      </option>
    );
  }

  return (
    <div>
      <h1>주간 그래프</h1>
      <div>
        <button onClick={handlePreviousMonth}>&lt;</button>
        <select value={selectedYear} onChange={handleYearChange}>
          {years}
        </select>
        <select value={selectedMonth} onChange={handleMonthChange}>
          {months}
        </select>
        <button onClick={handleNextMonth}>&gt;</button>
      </div>
      <div>{renderMonthGraph(selectedYear, selectedMonth)}</div>
    </div>
  );
}

export default App;