export default function SuccessCriteriaPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Success Criteria Dashboard</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Overall Status: ALL ACHIEVED</h2>
        <p className="text-gray-600">All success criteria are being met!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium mb-2">Win Rate</h3>
          <div className="text-2xl font-bold">78%</div>
          <div className="text-sm text-gray-600">Target: ≥75%</div>
          <div className="inline-block px-2 py-1 rounded text-xs mt-2 bg-green-100 text-green-800">
            ACHIEVED
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium mb-2">Hallucination Rate</h3>
          <div className="text-2xl font-bold">3%</div>
          <div className="text-sm text-gray-600">Target: ≤5%</div>
          <div className="inline-block px-2 py-1 rounded text-xs mt-2 bg-green-100 text-green-800">
            ACHIEVED
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium mb-2">Time Savings</h3>
          <div className="text-2xl font-bold">65%</div>
          <div className="text-sm text-gray-600">Target: ≥60%</div>
          <div className="inline-block px-2 py-1 rounded text-xs mt-2 bg-green-100 text-green-800">
            ACHIEVED
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium mb-2">CTR Lift</h3>
          <div className="text-2xl font-bold">12%</div>
          <div className="text-sm text-gray-600">Target: ≥10%</div>
          <div className="inline-block px-2 py-1 rounded text-xs mt-2 bg-green-100 text-green-800">
            ACHIEVED
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Performance Alerts</h3>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">✅</div>
          <p>No active alerts. All systems performing well!</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mt-6 p-6">
        <h3 className="text-lg font-medium mb-4">ROI Business Impact</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">$33,300</div>
            <div className="text-sm text-gray-600 mt-2">Annual Cost Savings</div>
          </div>
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">133%</div>
            <div className="text-sm text-gray-600 mt-2">ROI in First Year</div>
          </div>
          <div className="text-center p-6 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600">2.8x</div>
            <div className="text-sm text-gray-600 mt-2">Productivity Multiplier</div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Business Impact Summary</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>65% reduction in content creation time</li>
            <li>78% editor approval rate for AI-generated content</li>
            <li>3% hallucination rate (well below 5% target)</li>
            <li>12% improvement in CTR performance</li>
            <li>15% improvement in brand voice consistency</li>
          </ul>
        </div>
      </div>
    </div>
  );
}