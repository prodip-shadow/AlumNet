"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  MapPin,
  Globe,
  UserPlus,
  Check,
  Loader2,
  ShieldCheck,
  Eye,
  GraduationCap,
} from "lucide-react";
import { toast } from "react-toastify";
import { FaGithub, FaLinkedin } from "react-icons/fa6";

const AlumniCard = ({
  alumni,
  isInitiallyConnected = false,
  isInitiallyPending = false,
}) => {
  const { user: currentUser } = useAuth();
  const [sending, setSending] = useState(false);
  const [requestSent, setRequestSent] = useState(Boolean(isInitiallyPending));
  const [isConnected, setIsConnected] = useState(Boolean(isInitiallyConnected));
  const [errorMsg, setErrorMsg] = useState(null);

  const targetUserId = alumni.userId || alumni.id;
  const isSelf = Number(currentUser?.id) === Number(targetUserId);

  useEffect(() => {
    setIsConnected(Boolean(isInitiallyConnected));
  }, [isInitiallyConnected]);

  useEffect(() => {
    setRequestSent(Boolean(isInitiallyPending));
  }, [isInitiallyPending]);

  const handleSendConnection = async (e) => {
    e.stopPropagation();
    if (sending || requestSent || isConnected || isSelf) return;

    setSending(true);
    setErrorMsg(null);

    try {
      const response = await api.post(
        `/api/connections/request/${targetUserId}`,
      );
      if (response.data?.success) {
        setRequestSent(true);
        toast.success(`Connection request sent to ${alumni.name}!`, {
          autoClose: 1500,
        });
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to send connection request";
      setErrorMsg(msg);
      toast.error(msg, { autoClose: 2000 });
      if (msg.toLowerCase().includes("already pending")) {
        setRequestSent(true);
      } else if (msg.toLowerCase().includes("already connected")) {
        setIsConnected(true);
      }
    } finally {
      setSending(false);
    }
  };

  const profileHref = `/profile/${alumni.userId || alumni.id}`;

  return (
    <Card className="border border-border/80 bg-card hover:border-primary/40 hover:shadow-xs transition-all duration-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group">
      {/* Left Section: Avatar + Details */}
      <div className="flex items-start gap-4 min-w-0 flex-1">
        <Link href={profileHref} className="shrink-0">
          <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border-2 border-border shrink-0 cursor-pointer group-hover:border-primary/40 transition-colors shadow-2xs">
            {alumni.profileImageUrl ? (
              <AvatarImage src={alumni.profileImageUrl} alt={alumni.name} />
            ) : null}
            <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm sm:text-base">
              {alumni.name ? alumni.name.slice(0, 2).toUpperCase() : "AL"}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0 space-y-1">
          {/* Top Row: Name & Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={profileHref}>
              <h3
                className="font-bold text-base text-foreground hover:text-primary transition-colors cursor-pointer truncate max-w-[240px] sm:max-w-md"
                title={alumni.name}
              >
                {alumni.name}
              </h3>
            </Link>
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <Badge
              variant="secondary_1"
              className="px-2 py-0 text-[10px] font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-none"
            >
              Alumni
            </Badge>
            {alumni.graduationYear && (
              <span className="text-xs text-muted-foreground font-medium">
                • Class of {alumni.graduationYear}
              </span>
            )}
          </div>

          {/* Department / Faculty & Session */}
          <p
            className="text-xs text-muted-foreground truncate"
            title={alumni.departmentName || alumni.facultyName || ""}
          >
            {alumni.departmentName || alumni.facultyName || "PSTU Alumni"}
            {alumni.session && ` • Session: ${alumni.session}`}
          </p>

          {/* Professional Details */}
          {(alumni.currentPosition || alumni.currentCompany) && (
            <div className="flex items-center gap-1.5 text-xs text-foreground font-medium pt-0.5">
              <Briefcase className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="truncate">
                {alumni.currentPosition}
                {alumni.currentPosition && alumni.currentCompany ? " at " : ""}
                {alumni.currentCompany}
              </span>
            </div>
          )}

          {/* Location & Social Icons */}
          <div className="flex items-center gap-3 pt-0.5 text-xs text-muted-foreground flex-wrap">
            {alumni.currentLocation && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{alumni.currentLocation}</span>
              </div>
            )}

            {/* Social Icons (Respect privacy settings) */}
            <div className="flex items-center gap-2">
              {alumni.linkedinLink &&
                (isSelf ||
                  isConnected ||
                  !alumni.visibleContactMethods?.includes("linkedin")) && (
                  <a
                    href={
                      alumni.linkedinLink.startsWith("http")
                        ? alumni.linkedinLink
                        : `https://${alumni.linkedinLink}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors p-0.5"
                    title="LinkedIn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FaLinkedin className="h-3.5 w-3.5" />
                  </a>
                )}

              {alumni.githubLink &&
                (isSelf ||
                  isConnected ||
                  !alumni.visibleContactMethods?.includes("github")) && (
                  <a
                    href={
                      alumni.githubLink.startsWith("http")
                        ? alumni.githubLink
                        : `https://${alumni.githubLink}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                    title="GitHub"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FaGithub className="h-3.5 w-3.5" />
                  </a>
                )}

              {alumni.personalWebsite &&
                (isSelf ||
                  isConnected ||
                  !alumni.visibleContactMethods?.includes("website")) && (
                  <a
                    href={
                      alumni.personalWebsite.startsWith("http")
                        ? alumni.personalWebsite
                        : `https://${alumni.personalWebsite}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-emerald-600 transition-colors p-0.5"
                    title="Personal Website"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Globe className="h-3.5 w-3.5" />
                  </a>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Section: Action Buttons */}
      <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
        <Link
          href={`/alumni/${alumni.userId || alumni.id}`}
          className="flex-1 sm:flex-initial"
        >
          <Button
            variant="outline"
            size="sm"
            className="w-full h-9 px-3.5 text-xs font-semibold gap-1.5 border-border hover:bg-muted/80 cursor-pointer shadow-2xs"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>View Profile</span>
          </Button>
        </Link>

        {!isSelf && (
          <Button
            size="sm"
            onClick={handleSendConnection}
            disabled={sending || requestSent || isConnected || !currentUser}
            className={`flex-1 sm:flex-initial h-9 px-4 text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs ${isConnected || requestSent
                ? "bg-muted text-muted-foreground hover:bg-muted border border-border"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
          >
            {sending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : isConnected ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Connected</span>
              </>
            ) : requestSent ? (
              <>
                <Check className="h-3.5 w-3.5 text-primary" />
                <span>Pending</span>
              </>
            ) : (
              <>
                <UserPlus className="h-3.5 w-3.5" />
                <span>Connect</span>
              </>
            )}
          </Button>
        )}

        {isSelf && (
          <Badge
            variant="outline"
            className="flex-1 sm:flex-initial justify-center py-1.5 px-3 text-xs text-muted-foreground font-medium"
          >
            You
          </Badge>
        )}
      </div>
    </Card>
  );
};

export default AlumniCard;
