package com.albalog.domain;

/**
 * 후기 단계(작성 시점/종류)
 * - DB enum('INITIAL','MONTH_1','MONTH_3') 와 1:1 매핑
 */
public enum ReviewPhase {
    INITIAL,
    MONTH_1,
    MONTH_3
}
