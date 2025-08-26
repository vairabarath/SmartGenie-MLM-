import React from "react";
import {
  Users,
  User,
  Calendar,
  Hash,
  Key,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useMLMData } from "../hooks/useMLMData";
import BNBValue from "../components/ui/BNBValue";
import Income from "../components/ui/Income";

const Personal: React.FC = () => {
  const { data, loading, error } = useMLMData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading blockchain data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-gray-400">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!data.personal) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-400">No user data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* User Information Section */}
      <div className="bg-slate-700 rounded-xl p-6 shadow-lg">
        <div className="flex items-center space-x-3 mb-6">
          <User className="text-blue-400" size={24} />
          <h3 className="text-xl font-semibold text-white">
            Personal Information
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-800 rounded-lg p-4 flex items-start space-x-3 hover:bg-slate-750 transition-colors">
            <div className="bg-blue-500/20 p-2 rounded-full">
              <Hash className="text-blue-400" size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-gray-400 text-sm mb-1">User ID</p>
              <p className="text-white font-medium break-all">{data.personal.userId}</p>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-4 flex items-start space-x-3 hover:bg-slate-750 transition-colors">
            <div className="bg-blue-500/20 p-2 rounded-full">
              <Key className="text-blue-400" size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-gray-400 text-sm mb-1">Referrer ID</p>
              <p className="text-white font-medium break-all">{data.personal.refId}</p>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-4 flex items-start space-x-3 hover:bg-slate-750 transition-colors">
            <div className="bg-blue-500/20 p-2 rounded-full">
              <Calendar className="text-blue-400" size={18} />
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Join Date</p>
              <p className="text-white font-medium">
                {data.personal.doj ?? "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Statistics Section */}
      <div className="bg-slate-700 rounded-xl p-6 shadow-lg">
        <div className="flex items-center space-x-3 mb-6">
          <Users className="text-purple-400" size={24} />
          <h3 className="text-xl font-semibold text-white">Team Statistics</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-800 rounded-lg p-5 hover:bg-slate-750 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-500/20 p-2 rounded-full">
                <Users className="text-blue-400" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Direct Referrals</p>
                <p className="text-white text-2xl font-bold">
                  {data.team?.dRefCnt ?? "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-5 hover:bg-slate-750 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="bg-green-500/20 p-2 rounded-full">
                <Users className="text-green-400" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Team Development Count</p>
                <p className="text-white text-2xl font-bold">
                  {data.team?.refTotal ?? "N/A"}{" "}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Earnings Overview */}
      {data.income && (
        <div className="bg-slate-700 rounded-xl p-6 shadow-lg">
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-slate-800 rounded-lg p-4 hover:bg-slate-750 transition-colors">
                <div className="md:flex justify-between item-center">
                  <p className="text-xl font-semibold text-white">Total Earnings:</p>
                  <BNBValue
                    bnbAmount={data.income.totalInc}
                    bnbClassName="text-green-400 font-semibold text-lg"
                    decimals={4}
                  />
                </div>
            </div>
          </div>
        </div>
      )}
      <Income />
    </div>
  );
};

export default Personal;
