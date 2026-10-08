import { spawnSync } from 'node:child_process';
import process from 'node:process';

if (
  !process.execArgv.includes('--experimental-vm-modules') &&
  !process.env.NODE_OPTIONS?.includes('--experimental-vm-modules')
) {
  const result = spawnSync(
    process.execPath,
    ['--experimental-vm-modules', ...process.argv.slice(1)],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --experimental-vm-modules`.trim()
      }
    }
  );
  process.exit(result.status ?? 0);
}

/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.json'
      }
    ]
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.spec.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    'scripts/validate/**/*.js',
    'scripts/validate.js'
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      lines: 100,
      functions: 97,
      branches: 98
    }
  },
  passWithNoTests: true
};

