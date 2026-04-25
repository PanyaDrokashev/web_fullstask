package errs

import "errors"

var (
	ErrEmptyCommittee          = errors.New("committee is empty")
	ErrEmptyEduProgram         = errors.New("education programs is empty")
	ErrEmptyChairman           = errors.New("chairman is empty")
	ErrEmptyEduDirections      = errors.New("expert slice is empty")
	ErrInvalidNumberOfExperts  = errors.New("invalid number of experts")
	ErrInvalidInternalExperts  = errors.New("internal experts are invalid")
	ErrInvalidExternalExperts  = errors.New("external experts are invalid")
	ErrChairmanExpertConflict  = errors.New("chairman can not be expert in one committee")
	ErrChairmanWrongProgram    = errors.New("can not appoint chairman to not his educational program")
	ErrChairmanWrongDirection  = errors.New("can not appoint chairman to not his educational direction")
	ErrSimilarCommittee        = errors.New("committee is similar to existing one")
	ErrSecretaryWrongProgram   = errors.New("can not appoint chairman to not secretary educational program")
	ErrSecretaryWrongDirection = errors.New("can not appoint chairman to not secretary educational direction")
	ErrCommitteeNotFound       = errors.New("committee not found")
)
