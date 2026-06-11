import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faShoppingCart, faBox, faDollarSign, faUsers } from '@fortawesome/free-solid-svg-icons';
import { api } from '../config/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.dashboard.getStats();
        setDashboardData(response.data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        if (err.response) {
          setError(`Failed to load dashboard data: ${err.response.status} - ${err.response.statusText}`);
          console.error('Response data:', err.response.data);
        } else if (err.request) {
          setError('Failed to load dashboard data: No response from server. Check if the server is running on port 3003.');
        } else {
          setError(`Failed to load dashboard data: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard</h1>
        <div className="flex justify-center items-center h-64">
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard</h1>
        <div className="flex justify-center items-center h-64">
          <p>No data available</p>
        </div>
      </div>
    );
  }

  // Ensure dashboardData has the expected structure
  const validDashboardData = {
    totalRevenue: dashboardData.totalRevenue || 0,
    totalSales: dashboardData.totalSales || 0,
    totalProducts: dashboardData.totalProducts || 0,
    uniqueCustomers: dashboardData.uniqueCustomers || 0,
    salesChartData: Array.isArray(dashboardData.salesChartData) ? dashboardData.salesChartData : [],
    paymentMethodsChartData: Array.isArray(dashboardData.paymentMethodsChartData) ? dashboardData.paymentMethodsChartData : [],
    recentSales: Array.isArray(dashboardData.recentSales) ? dashboardData.recentSales : [],
    topProducts: Array.isArray(dashboardData.topProducts) ? dashboardData.topProducts : [],
    last7DaysBreakdown: Array.isArray(dashboardData.last7DaysBreakdown) ? dashboardData.last7DaysBreakdown : [],
    last30DaysBreakdown: Array.isArray(dashboardData.last30DaysBreakdown) ? dashboardData.last30DaysBreakdown : [],
  };
  
  // Log the data for debugging
  console.log('Dashboard Data:', dashboardData);
  
  // Prepare chart data for 7-day breakdown
  const last7DaysData = {
    labels: validDashboardData.last7DaysBreakdown.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Sales Count',
        data: validDashboardData.last7DaysBreakdown.map(item => item.count),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 2,
        borderRadius: 5,
        yAxisID: 'y',
      },
      {
        label: 'Revenue (₵)',
        data: validDashboardData.last7DaysBreakdown.map(item => item.revenue),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 2,
        borderRadius: 5,
        yAxisID: 'y1',
      }
    ],
  };

  const last7DaysOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    stacked: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
        }
      },
      title: {
        display: true,
        text: 'Last 7 Days Sales Breakdown',
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
        usePointStyle: true,
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: {
          drawTicks: false,
        },
        ticks: {
          callback: function(value) {
            return value;
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
          drawTicks: false,
        },
        ticks: {
          callback: function(value) {
            return '₵' + value;
          }
        }
      },
    },
  };
  
  // Prepare chart data
  const salesTrendData = {
    labels: validDashboardData.salesChartData.map(item => item.date),
    datasets: [
      {
        label: 'Sales Count',
        data: validDashboardData.salesChartData.map(item => item.count),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        yAxisID: 'y',
      },
      {
        label: 'Revenue (₵)',
        data: validDashboardData.salesChartData.map(item => item.revenue),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        yAxisID: 'y1',
      }
    ],
  };
  
  const salesTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    stacked: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
        }
      },
      title: {
        display: true,
        text: 'Sales Trend',
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
        usePointStyle: true,
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: {
          drawTicks: false,
        },
        ticks: {
          callback: function(value) {
            return value;
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
          drawTicks: false,
        },
        ticks: {
          callback: function(value) {
            return '₵' + value;
          }
        }
      },
    },
  };
  
  // Top products chart data
  const topProductsData = {
    labels: validDashboardData.topProducts.map(product => product.name || 'Unknown Product'),
    datasets: [
      {
        label: 'Units Sold',
        data: validDashboardData.topProducts.map(product => product.salesCount || 0),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };
  
  const topProductsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Top Selling Products',
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          autoSkip: false,
          maxRotation: 45,
          minRotation: 45,
        }
      },
      y: {
        grid: {
          drawTicks: false,
        },
        ticks: {
          precision: 0,
        }
      }
    },
  };
  
  // Payment methods chart data
  const paymentMethodsData = {
    labels: validDashboardData.paymentMethodsChartData.map(item => item.method),
    datasets: [
      {
        data: validDashboardData.paymentMethodsChartData.map(item => item.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
        hoverOffset: 4
      }
    ],
  };
  
  const paymentMethodsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 20,
        }
      },
      title: {
        display: true,
        text: 'Payment Methods',
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
      }
    },
  };

  const stats = [
    { title: 'Total Revenue', value: `₵${validDashboardData.totalRevenue.toFixed(2)}`, icon: faDollarSign, color: 'bg-blue-500' },
    { title: 'Total Sales', value: validDashboardData.totalSales, icon: faShoppingCart, color: 'bg-green-500' },
    { title: 'Products', value: validDashboardData.totalProducts, icon: faBox, color: 'bg-yellow-500' },
    { title: 'Customers', value: validDashboardData.uniqueCustomers, icon: faUsers, color: 'bg-purple-500' },
  ];

  // Ensure period stats exist in data
  const periodStats = {
    daily: dashboardData.dailyStats || { count: 0, revenue: 0, label: 'Today' },
    weekly: dashboardData.weeklyStats || { count: 0, revenue: 0, label: 'This Week (Last 7 Days)' },
    monthly: dashboardData.monthlyStats || { count: 0, revenue: 0, label: 'This Month' },
    lastMonth: dashboardData.lastMonthStats || { count: 0, revenue: 0, label: 'Last Month' },
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-full text-white mr-4`}>
                <FontAwesomeIcon icon={stat.icon} size="lg" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Period Stats Grid - Daily, Weekly, Monthly */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Daily Stats */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">TODAY'S SALES</h3>
          <p className="text-3xl font-bold text-blue-600 mb-2">₵{periodStats.daily.revenue.toFixed(2)}</p>
          <p className="text-sm text-gray-600">{periodStats.daily.count} {periodStats.daily.count === 1 ? 'sale' : 'sales'}</p>
        </div>

        {/* Weekly Stats */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">THIS WEEK</h3>
          <p className="text-3xl font-bold text-green-600 mb-2">₵{periodStats.weekly.revenue.toFixed(2)}</p>
          <p className="text-sm text-gray-600">{periodStats.weekly.count} {periodStats.weekly.count === 1 ? 'sale' : 'sales'}</p>
        </div>

        {/* Monthly Stats */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">THIS MONTH</h3>
          <p className="text-3xl font-bold text-purple-600 mb-2">₵{periodStats.monthly.revenue.toFixed(2)}</p>
          <p className="text-sm text-gray-600">{periodStats.monthly.count} {periodStats.monthly.count === 1 ? 'sale' : 'sales'}</p>
        </div>

        {/* Last Month Stats */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">LAST MONTH</h3>
          <p className="text-3xl font-bold text-orange-600 mb-2">₵{periodStats.lastMonth.revenue.toFixed(2)}</p>
          <p className="text-sm text-gray-600">{periodStats.lastMonth.count} {periodStats.lastMonth.count === 1 ? 'sale' : 'sales'}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sales Chart */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Sales Overview</h2>
          <div className="h-64">
            {validDashboardData.salesChartData.length > 0 ? (
              <Line data={salesTrendData} options={salesTrendOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No sales data available for chart</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Activity</h2>
          <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
            {validDashboardData.recentSales.map((sale, index) => (
              <div key={sale._id || index} className="flex items-center border-b pb-3 last:border-0 last:pb-0 hover:bg-gray-50 p-2 rounded transition-colors duration-200">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <FontAwesomeIcon icon={faShoppingCart} className="text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Sale #{index + 1}</p>
                  <p className="text-sm text-gray-500">{sale.createdAt ? new Date(sale.createdAt).toLocaleString() : 'N/A'}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="font-medium">₵{sale.total ? sale.total.toFixed(2) : '0.00'}</p>
                  <p className="text-sm text-green-500">{sale.paymentMethod || 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Products Chart */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Top Selling Products</h2>
          <div className="h-64">
            {validDashboardData.topProducts.length > 0 ? (
              <Bar data={topProductsData} options={topProductsOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No product data available for chart</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods Chart */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Payment Methods</h2>
          <div className="h-64">
            {validDashboardData.paymentMethodsChartData.length > 0 ? (
              <Pie data={paymentMethodsData} options={paymentMethodsOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No payment data available for chart</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Products Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Top Selling Products</h2>
        <div className="h-64">
          {validDashboardData.topProducts.length > 0 ? (
            <Bar data={topProductsData} options={topProductsOptions} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No product data available for chart</p>
            </div>
          )}
        </div>
      </div>

      {/* 7-Day Breakdown Chart */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Last 7 Days Breakdown</h2>
        <div className="h-80">
          {validDashboardData.last7DaysBreakdown.length > 0 ? (
            <Bar data={last7DaysData} options={last7DaysOptions} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No data available for 7-day breakdown</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;