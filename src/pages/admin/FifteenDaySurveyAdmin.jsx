import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { fifteenDaySurveyAPI } from '../../services/api';

const NAVY = '#1B2A4A';

const toLocalInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const FifteenDaySurveyAdmin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [savingDate, setSavingDate] = useState(false);
  const [surveys, setSurveys] = useState([]);
  const [program, setProgram] = useState(null);
  const [sendAt, setSendAt] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fifteenDaySurveyAPI.getBoard({ skipErrorToast: true });
      const nextSurveys = res.data?.data?.surveys || [];
      const nextProgram = res.data?.data?.program || null;
      setSurveys(nextSurveys);
      setProgram(nextProgram);
      setSendAt(toLocalInput(nextProgram?.existingUsersSendAt));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load the 15-day survey');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const byDay = new Map(surveys.map((survey) => [survey.daySlot, survey]));
  const alreadySent = Boolean(program?.existingBlastRanAt);

  const saveSendDate = async (event) => {
    event.preventDefault();
    if (!sendAt) return toast.error('Choose a date and time');
    setSavingDate(true);
    try {
      const res = await fifteenDaySurveyAPI.updateProgram(new Date(sendAt).toISOString());
      const next = res.data?.data;
      setProgram(next);
      if (next?.existingBlastRanAt) {
        toast.success('Existing users are enrolled. Anyone already on this cycle was left as they are.');
      } else {
        toast.success('Send time saved. Existing users will get day 1 then.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save the send time');
    } finally {
      setSavingDate(false);
    }
  };

  const archive = async (survey) => {
    if (!window.confirm(`Archive day ${survey.daySlot}? It leaves Daily Sprint for anyone who has not finished it.`)) return;
    try {
      await fifteenDaySurveyAPI.archive(survey._id);
      toast.success(`Day ${survey.daySlot} archived`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not archive');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">15-day survey</h1>
              <p className="text-sm text-gray-500">
                One preset per day. It stays on a user’s Daily Sprint until they finish it, then repeats every 90 days.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-28 space-y-6">
        <form onSubmit={saveSendDate} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">When existing users get this</h2>
            <p className="text-sm text-gray-500 mt-1">
              Accounts that already exist start together on this date. New accounts start the day their profile is completed, once a day is published. Sending again does not enroll someone who is already on the cycle.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <label className="block flex-1">
              <span className="block text-sm font-semibold text-gray-900 mb-2">Send to existing users</span>
              <input
                type="datetime-local"
                value={sendAt}
                onChange={(event) => setSendAt(event.target.value)}
                disabled={alreadySent}
                className="w-full max-w-md px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                required
              />
            </label>
            <button
              type="submit"
              disabled={savingDate || alreadySent}
              className="px-5 py-3 rounded-xl text-white text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: NAVY }}
            >
              {savingDate ? 'Saving…' : alreadySent ? 'Already sent' : 'Save send time'}
            </button>
          </div>
          {alreadySent ? (
            <p className="text-sm text-green-700">
              Sent {new Date(program.existingBlastRanAt).toLocaleString()}. Existing users already on this cycle were not enrolled again.
            </p>
          ) : null}
        </form>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Days 1–15</h2>
              <p className="text-sm text-gray-500">Publish a day for it to go out. Drafts stay here until you do.</p>
            </div>
            <div className="divide-y divide-gray-100">
              {Array.from({ length: 15 }, (_, index) => {
                const day = index + 1;
                const survey = byDay.get(day);
                return (
                  <div key={day} className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="w-16 shrink-0 text-sm font-bold text-gray-900">Day {day}</div>
                    <div className="flex-1 min-w-0">
                      {survey ? (
                        <>
                          <p className="font-medium text-gray-900 truncate">{survey.title}</p>
                          <p className="text-xs text-gray-500 capitalize">{survey.status} · {survey.questions?.length || 0} questions</p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-400">Empty</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {survey ? (
                        <>
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/edit-sep-survey/${survey._id}?sprint=1&day=${day}`)}
                            className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => archive(survey)}
                            className="px-3 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-100 hover:bg-red-50"
                          >
                            Archive
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/create-sep-survey?sprint=1&day=${day}`)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white"
                          style={{ backgroundColor: NAVY }}
                        >
                          <Plus className="h-4 w-4" /> Create
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FifteenDaySurveyAdmin;
