'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ShieldAlert,
  ShieldCheck,
  GraduationCap,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Send,
  Building,
  User,
  AlertCircle,
} from 'lucide-react';
import PaymentHistorySection from '@/components/shared/PaymentHistorySection';

const UserDashboard = () => {
  const [application, setApplication] = useState(null);
  const [loadingApp, setLoadingApp] = useState(true);

  // Form State
  const [appType, setAppType] = useState('STUDENT');
  const [district, setDistrict] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [session, setSession] = useState('');
  const [currentSemester, setCurrentSemester] = useState('1st');
  const [graduationYear, setGraduationYear] = useState(new Date().getFullYear());
  const [currentPosition, setCurrentPosition] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');

  // Academics List
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filteredDepts, setFilteredDepts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const showFeedback = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 5000);
  };

  // 1. Fetch Verification Application
  const fetchApplication = useCallback(async () => {
    setLoadingApp(true);
    try {
      const res = await api.get('/api/verification/my-application');
      if (res.data?.success && res.data.application) {
        setApplication(res.data.application);
      } else {
        setApplication(null);
      }
    } catch (err) {
      setApplication(null);
    } finally {
      setLoadingApp(false);
    }
  }, []);

  // 2. Fetch Academics
  const fetchAcademics = useCallback(async () => {
    try {
      const [facRes, deptRes] = await Promise.allSettled([
        api.get('/api/faculties'),
        api.get('/api/departments'),
      ]);

      if (facRes.status === 'fulfilled' && facRes.value.data?.success) {
        setFaculties(facRes.value.data.faculties || []);
        if (facRes.value.data.faculties?.length > 0) {
          setFacultyId(String(facRes.value.data.faculties[0].id));
        }
      }

      if (deptRes.status === 'fulfilled' && deptRes.value.data?.success) {
        setDepartments(deptRes.value.data.departments || []);
      }
    } catch (err) {
      console.warn('Error fetching faculties/departments:', err);
    }
  }, []);

  useEffect(() => {
    fetchApplication();
    fetchAcademics();
  }, [fetchApplication, fetchAcademics]);

  // Filter departments when faculty changes
  useEffect(() => {
    if (facultyId) {
      const filtered = departments.filter((d) => Number(d.facultyId) === Number(facultyId));
      setFilteredDepts(filtered);
      setDepartmentId(filtered.length > 0 ? String(filtered[0].id) : '');
    } else {
      setFilteredDepts([]);
      setDepartmentId('');
    }
  }, [facultyId, departments]);

  // Handle Form Submit
  const handleApplyVerification = async (e) => {
    e.preventDefault();
    if (!district.trim() || !universityId.trim() || !registrationNumber.trim() || !facultyId || !session.trim()) {
      showFeedback('error', 'Please fill all required fields');
      return;
    }

    if (appType === 'STUDENT' && !currentSemester) {
      showFeedback('error', 'Current semester is required for student verification');
      return;
    }

    if (appType === 'ALUMNI' && !graduationYear) {
      showFeedback('error', 'Graduation year is required for alumni verification');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        applicationType: appType,
        district: district.trim(),
        universityId: universityId.trim(),
        registrationNumber: registrationNumber.trim(),
        facultyId: Number(facultyId),
        departmentId: departmentId ? Number(departmentId) : null,
        session: session.trim(),
        currentSemester: appType === 'STUDENT' ? currentSemester : null,
        graduationYear: appType === 'ALUMNI' ? Number(graduationYear) : null,
        currentPosition: appType === 'ALUMNI' ? currentPosition.trim() || null : null,
        currentCompany: appType === 'ALUMNI' ? currentCompany.trim() || null : null,
      };

      const res = await api.post('/api/verification/apply', payload);
      if (res.data?.success) {
        showFeedback('success', 'Verification application submitted successfully!');
        fetchApplication();
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to submit verification');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
              : 'bg-destructive/10 text-destructive border border-destructive/30'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Intro Header */}
      <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-2xs space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">University Account Verification</h2>
            <p className="text-xs text-muted-foreground">
              Verify your PSTU student or alumni identity to unlock full network access, post opportunities, and connect.
            </p>
          </div>
        </div>
      </Card>

      {/* Loading state */}
      {loadingApp ? (
        <div className="p-12 text-center text-xs text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
          Checking verification status...
        </div>
      ) : application ? (
        /* Submitted Application Status Card */
        <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-sm text-foreground">Application Status</h3>
            <Badge
              variant="secondary"
              className={`text-xs font-bold ${
                application.status === 'APPROVED'
                  ? 'bg-emerald-500/10 text-emerald-700'
                  : application.status === 'REJECTED'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
              }`}
            >
              {application.status}
            </Badge>
          </div>

          <div className="bg-muted/30 p-4 rounded-xl border border-border/70 text-xs space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-muted-foreground block">Applying As:</span>
                <span className="font-semibold text-foreground">{application.applicationType}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Student/Univ ID:</span>
                <span className="font-semibold text-foreground">{application.universityId}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Reg Number:</span>
                <span className="font-semibold text-foreground">{application.registrationNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Session:</span>
                <span className="font-semibold text-foreground">{application.session}</span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/60">
              Submitted on: {new Date(application.createdAt).toLocaleDateString()}
            </p>
          </div>

          {application.status === 'PENDING' && (
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" />
              <span>Your application is currently pending admin approval. You will receive a notification once verified.</span>
            </div>
          )}

          {application.status === 'REJECTED' && (
            <div className="p-3.5 bg-destructive/10 rounded-xl text-destructive text-xs space-y-2">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                <span>Application Rejected</span>
              </p>
              {application.rejectionReason && (
                <p className="text-foreground/90">Reason: "{application.rejectionReason}"</p>
              )}
              <p className="text-[11px] opacity-90">Please re-verify your university credentials and submit again.</p>
            </div>
          )}
        </Card>
      ) : (
        /* Verification Application Form */
        <form onSubmit={handleApplyVerification} className="space-y-4">
          <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-2xs space-y-4">
            {/* Account Type Selector */}
            <div>
              <label className="font-semibold text-xs text-foreground block mb-2">Select Your Status</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAppType('STUDENT')}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-3 ${
                    appType === 'STUDENT'
                      ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary'
                      : 'border-border bg-card hover:bg-muted/40 text-muted-foreground'
                  }`}
                >
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-bold text-xs">Current Student</h4>
                    <p className="text-[10px] text-muted-foreground">Currently enrolled at PSTU</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAppType('ALUMNI')}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-3 ${
                    appType === 'ALUMNI'
                      ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary'
                      : 'border-border bg-card hover:bg-muted/40 text-muted-foreground'
                  }`}
                >
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <div>
                    <h4 className="font-bold text-xs">Graduated Alumni</h4>
                    <p className="text-[10px] text-muted-foreground">Completed degree from PSTU</p>
                  </div>
                </button>
              </div>
            </div>

            {/* University Credentials */}
            <div className="space-y-3.5 text-xs pt-2 border-t border-border">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold block mb-1">Student / University ID *</label>
                  <Input
                    value={universityId}
                    onChange={(e) => setUniversityId(e.target.value)}
                    placeholder="e.g. 1902001"
                    required
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Registration Number *</label>
                  <Input
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="e.g. REG-08123"
                    required
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold block mb-1">Faculty *</label>
                  <select
                    value={facultyId}
                    onChange={(e) => setFacultyId(e.target.value)}
                    required
                    className="w-full h-9 px-3 text-xs bg-background border border-border rounded-lg text-foreground cursor-pointer"
                  >
                    {faculties.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Department (Optional)</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-background border border-border rounded-lg text-foreground cursor-pointer"
                  >
                    <option value="">Select Department...</option>
                    {filteredDepts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold block mb-1">Session *</label>
                  <Input
                    value={session}
                    onChange={(e) => setSession(e.target.value)}
                    placeholder="e.g. 2018-19"
                    required
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">District *</label>
                  <Input
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Patuakhali or Dhaka"
                    required
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Conditional Fields: Student */}
              {appType === 'STUDENT' && (
                <div>
                  <label className="font-semibold block mb-1">Current Semester *</label>
                  <select
                    value={currentSemester}
                    onChange={(e) => setCurrentSemester(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-background border border-border rounded-lg text-foreground cursor-pointer"
                  >
                    {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'].map((sem) => (
                      <option key={sem} value={sem}>
                        {sem} Semester
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Conditional Fields: Alumni */}
              {appType === 'ALUMNI' && (
                <div className="space-y-3.5 pt-2 border-t border-border/70">
                  <div>
                    <label className="font-semibold block mb-1">Graduation Year *</label>
                    <Input
                      type="number"
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      placeholder="e.g. 2023"
                      required
                      min={1950}
                      max={2100}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="font-semibold block mb-1">Current Position (Optional)</label>
                      <Input
                        value={currentPosition}
                        onChange={(e) => setCurrentPosition(e.target.value)}
                        placeholder="e.g. Software Engineer"
                        className="h-9 text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-semibold block mb-1">Company / Organization (Optional)</label>
                      <Input
                        value={currentCompany}
                        onChange={(e) => setCurrentCompany(e.target.value)}
                        placeholder="e.g. Tech Corp"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button type="submit" disabled={submitting} className="h-10 text-xs font-semibold gap-1.5 w-full cursor-pointer mt-2 shadow-xs">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span>Submit Verification Application</span>
            </Button>
          </Card>
        </form>
      )}

      {/* Payment History & Receipts */}
      <PaymentHistorySection />
    </div>
  );
};

export default UserDashboard;
