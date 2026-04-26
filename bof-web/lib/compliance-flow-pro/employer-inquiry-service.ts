/**
 * ComplianceFlow Pro - Good Faith Employer Inquiry Service
 * 
 * Manages prior employer inquiry workflows with attempt tracking,
 * good faith effort certification, and documentation generation.
 */

import type {
  DqfEmployerInquiry,
  DqfInquiryAttempt,
  DqfDocumentRecord,
} from "./dqf-types";

export class EmployerInquiryService {
  /**
   * Create a new employer inquiry for a driver
   */
  createEmployerInquiry(
    driverId: string,
    priorEmployer: string,
    contactInfo: {
      contactName?: string;
      contactTitle?: string;
      phoneNumber?: string;
      email?: string;
      fax?: string;
    }
  ): DqfEmployerInquiry {
    const inquiryId = `inquiry-${driverId}-${Date.now()}`;
    const now = new Date().toISOString();

    return {
      id: inquiryId,
      driverId,
      priorEmployer,
      contactName: contactInfo.contactName,
      contactTitle: contactInfo.contactTitle,
      phoneNumber: contactInfo.phoneNumber,
      email: contactInfo.email,
      fax: contactInfo.fax,
      attempts: [],
      status: "in_progress",
      responseReceived: false,
      createdAt: now,
      nextAttemptDate: this.calculateNextAttemptDate(now),
    };
  }

  /**
   * Add an inquiry attempt
   */
  addInquiryAttempt(
    inquiry: DqfEmployerInquiry,
    method: "phone" | "email" | "fax" | "mail" | "portal",
    result: "contact_made" | "no_answer" | "wrong_number" | "email_bounced" | "fax_failed" | "left_message",
    notes?: string
  ): DqfEmployerInquiry {
    const attempt: DqfInquiryAttempt = {
      id: `attempt-${inquiry.id}-${inquiry.attempts.length + 1}`,
      attemptNumber: inquiry.attempts.length + 1,
      method,
      contactInfo: this.getContactInfoForMethod(inquiry, method),
      attemptedAt: new Date().toISOString(),
      result,
      notes,
      followUpRequired: this.requiresFollowUp(result),
      nextAttemptDate: this.calculateNextAttemptDate(new Date().toISOString()),
    };

    const updatedInquiry = {
      ...inquiry,
      attempts: [...inquiry.attempts, attempt],
      nextAttemptDate: attempt.nextAttemptDate,
    };

    // Check if inquiry should be marked as good faith effort
    if (this.shouldDeclareGoodFaithEffort(updatedInquiry)) {
      return this.declareGoodFaithEffort(updatedInquiry);
    }

    return updatedInquiry;
  }

  /**
   * Record response to inquiry
   */
  recordInquiryResponse(
    inquiry: DqfEmployerInquiry,
    responseSummary: string,
    concernsIdentified?: string[],
    responseFileUrl?: string
  ): DqfEmployerInquiry {
    return {
      ...inquiry,
      status: "completed",
      responseReceived: true,
      responseDate: new Date().toISOString(),
      responseSummary,
      concernsIdentified,
      responseFileUrl,
    };
  }

  /**
   * Declare good faith effort after failed attempts
   */
  declareGoodFaithEffort(
    inquiry: DqfEmployerInquiry,
    justification?: string
  ): DqfEmployerInquiry {
    return {
      ...inquiry,
      status: "good_faith_effort",
      goodFaithEffortDeclared: true,
      goodFaithEffortDate: new Date().toISOString(),
      goodFaithEffortJustification: justification || this.generateGoodFaithJustification(inquiry),
    };
  }

  /**
   * Generate good faith effort certificate
   */
  generateGoodFaithCertificate(inquiry: DqfEmployerInquiry): {
    certificateUrl: string;
    certificateData: any;
  } {
    const certificateData = {
      driverId: inquiry.driverId,
      priorEmployer: inquiry.priorEmployer,
      attempts: inquiry.attempts,
      goodFaithEffortDate: inquiry.goodFaithEffortDate,
      justification: inquiry.goodFaithEffortJustification,
      generatedAt: new Date().toISOString(),
      certificateNumber: `GFE-${inquiry.driverId}-${Date.now()}`,
    };

    return {
      certificateUrl: `/certificates/good-faith/${inquiry.id}`,
      certificateData,
    };
  }

  /**
   * Get contact info for specific method
   */
  private getContactInfoForMethod(
    inquiry: DqfEmployerInquiry,
    method: string
  ): string {
    switch (method) {
      case "phone":
        return inquiry.phoneNumber || "No phone number on file";
      case "email":
        return inquiry.email || "No email on file";
      case "fax":
        return inquiry.fax || "No fax number on file";
      case "mail":
        return "Mail address on file";
      case "portal":
        return "Online portal";
      default:
        return "Unknown contact method";
    }
  }

  /**
   * Determine if follow-up is required based on result
   */
  private requiresFollowUp(result: DqfInquiryAttempt["result"]): boolean {
    const followUpRequired = [
      "no_answer",
      "wrong_number", 
      "email_bounced",
      "fax_failed",
      "left_message"
    ];
    return followUpRequired.includes(result);
  }

  /**
   * Calculate next attempt date (3 business days from now)
   */
  private calculateNextAttemptDate(fromDate: string): string {
    const date = new Date(fromDate);
    let businessDaysAdded = 0;
    
    while (businessDaysAdded < 3) {
      date.setDate(date.getDate() + 1);
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        businessDaysAdded++;
      }
    }
    
    return date.toISOString();
  }

  /**
   * Determine if good faith effort should be declared
   */
  private shouldDeclareGoodFaithEffort(inquiry: DqfEmployerInquiry): boolean {
    // Good faith effort after 3 failed attempts
    if (inquiry.attempts.length >= 3) {
      const failedAttempts = inquiry.attempts.filter(attempt => 
        ["no_answer", "wrong_number", "email_bounced", "fax_failed"].includes(attempt.result)
      );
      return failedAttempts.length >= 3;
    }

    // Good faith effort after 14 days of attempts
    const firstAttempt = inquiry.attempts[0];
    if (firstAttempt) {
      const daysSinceFirst = Math.ceil(
        (new Date().getTime() - new Date(firstAttempt.attemptedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceFirst >= 14;
    }

    return false;
  }

  /**
   * Generate good faith effort justification
   */
  private generateGoodFaithJustification(inquiry: DqfEmployerInquiry): string {
    const attempts = inquiry.attempts;
    const methods = [...new Set(attempts.map(a => a.method))];
    const failedResults = attempts.filter(a => 
      ["no_answer", "wrong_number", "email_bounced", "fax_failed"].includes(a.result)
    );

    let justification = `Made ${attempts.length} attempt(s) over ${methods.length} method(s): `;
    justification += methods.join(", ");
    
    if (failedResults.length > 0) {
      justification += `. Failed results: ${failedResults.map(r => r.result).join(", ")}`;
    }

    const daysSpanned = attempts.length > 1 
      ? Math.ceil(
          (new Date(attempts[attempts.length - 1].attemptedAt).getTime() - 
           new Date(attempts[0].attemptedAt).getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0;

    if (daysSpanned > 0) {
      justification += ` over ${daysSpanned} day(s)`;
    }

    return justification;
  }

  /**
   * Get inquiry status summary
   */
  getInquiryStatusSummary(inquiry: DqfEmployerInquiry): {
    status: string;
    attemptsCount: number;
    lastAttemptDate?: string;
    nextAttemptDate?: string;
    isOverdue: boolean;
  } {
    const lastAttempt = inquiry.attempts[inquiry.attempts.length - 1];
    const isOverdue = inquiry.nextAttemptDate 
      ? new Date(inquiry.nextAttemptDate) < new Date()
      : false;

    return {
      status: inquiry.status,
      attemptsCount: inquiry.attempts.length,
      lastAttemptDate: lastAttempt?.attemptedAt,
      nextAttemptDate: inquiry.nextAttemptDate,
      isOverdue,
    };
  }

  /**
   * Get pending inquiries for a driver
   */
  getPendingInquiriesForDriver(
    inquiries: DqfEmployerInquiry[],
    driverId: string
  ): DqfEmployerInquiry[] {
    return inquiries.filter(inquiry => 
      inquiry.driverId === driverId && 
      ["in_progress", "good_faith_effort"].includes(inquiry.status)
    );
  }

  /**
   * Get inquiries requiring follow-up
   */
  getInquiriesRequiringFollowUp(inquiries: DqfEmployerInquiry[]): DqfEmployerInquiry[] {
    const now = new Date();
    
    return inquiries.filter(inquiry => {
      if (inquiry.status !== "in_progress") return false;
      if (!inquiry.nextAttemptDate) return false;
      
      return new Date(inquiry.nextAttemptDate) <= now;
    });
  }

  /**
   * Update inquiry from document data
   */
  updateInquiryFromDocument(
    inquiry: DqfEmployerInquiry,
    document: DqfDocumentRecord
  ): DqfEmployerInquiry {
    // Extract contact info from document if available
    const extractedContact = document.extractedFields;
    
    if (extractedContact) {
      return {
        ...inquiry,
        contactName: (extractedContact.contactName as string) || inquiry.contactName,
        phoneNumber: (extractedContact.phoneNumber as string) || inquiry.phoneNumber,
        email: (extractedContact.email as string) || inquiry.email,
      };
    }
    
    return inquiry;
  }

  /**
   * Generate inquiry report for compliance review
   */
  generateInquiryReport(inquiries: DqfEmployerInquiry[]): {
    totalInquiries: number;
    completedInquiries: number;
    goodFaithEfforts: number;
    failedInquiries: number;
    averageAttemptsPerInquiry: number;
    inquiriesByMethod: Record<string, number>;
    inquiriesByResult: Record<string, number>;
  } {
    const total = inquiries.length;
    const completed = inquiries.filter(i => i.status === "completed").length;
    const goodFaith = inquiries.filter(i => i.status === "good_faith_effort").length;
    const failed = inquiries.filter(i => i.status === "failed").length;
    
    const totalAttempts = inquiries.reduce((sum, i) => sum + i.attempts.length, 0);
    const averageAttempts = total > 0 ? totalAttempts / total : 0;
    
    const methods: Record<string, number> = {};
    const results: Record<string, number> = {};
    
    inquiries.forEach(inquiry => {
      inquiry.attempts.forEach(attempt => {
        methods[attempt.method] = (methods[attempt.method] || 0) + 1;
        results[attempt.result] = (results[attempt.result] || 0) + 1;
      });
    });
    
    return {
      totalInquiries: total,
      completedInquiries: completed,
      goodFaithEfforts: goodFaith,
      failedInquiries: failed,
      averageAttemptsPerInquiry: Math.round(averageAttempts * 10) / 10,
      inquiriesByMethod: methods,
      inquiriesByResult: results,
    };
  }

  /**
   * Validate inquiry data completeness
   */
  validateInquiryData(inquiry: DqfEmployerInquiry): {
    isValid: boolean;
    missingFields: string[];
    warnings: string[];
  } {
    const missingFields: string[] = [];
    const warnings: string[] = [];
    
    if (!inquiry.priorEmployer) {
      missingFields.push("priorEmployer");
    }
    
    if (!inquiry.phoneNumber && !inquiry.email && !inquiry.fax) {
      missingFields.push("contactMethod");
      warnings.push("No contact information available");
    }
    
    if (inquiry.attempts.length === 0) {
      warnings.push("No attempts made yet");
    }
    
    if (inquiry.status === "in_progress" && !inquiry.nextAttemptDate) {
      missingFields.push("nextAttemptDate");
    }
    
    return {
      isValid: missingFields.length === 0,
      missingFields,
      warnings,
    };
  }

  /**
   * Archive completed inquiries
   */
  archiveCompletedInquiries(
    inquiries: DqfEmployerInquiry[],
    archiveAfterDays: number = 90
  ): DqfEmployerInquiry[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - archiveAfterDays);
    
    return inquiries.filter(inquiry => {
      const isCompleted = ["completed", "good_faith_effort", "waived"].includes(inquiry.status);
      const isRecent = inquiry.completedAt 
        ? new Date(inquiry.completedAt) > cutoffDate
        : true;
      
      return !(isCompleted && !isRecent);
    });
  }
}
