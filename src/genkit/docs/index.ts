export const examplesXML = `
<securityRulesExamples>
  <!-- Example 1: Overly permissive “allow all” rule -->
  <example>
    <string name="bad_practice_allow_all"><![CDATA[
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // BAD: allows anyone—authenticated or not—to read & write any document
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
    ]]></string>
    <string name="good_practice_owner_only"><![CDATA[
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users may read/write their own user doc
    match /users/{userId} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
    // Deny everything else by default
  }
}
    ]]></string>
  </example>

  <!-- Example 2: Missing data validation on writes -->
  <example>
    <string name="bad_practice_no_validation"><![CDATA[
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /posts/{postId} {
      // BAD: lets any authenticated user write arbitrary fields
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
  }
}
    ]]></string>
    <string name="good_practice_with_validation"><![CDATA[
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /posts/{postId} {
      allow create, update: if request.auth != null
        // only allow expected fields
        && request.resource.data.keys().hasOnly(['title','body','authorId','createdAt'])
        // enforce types & sizes
        && request.resource.data.title is string
        && request.resource.data.title.size() <= 100
        && request.resource.data.body is string
        && request.resource.data.authorId == request.auth.uid
        && request.resource.data.createdAt == request.time;
    }
  }
}
    ]]></string>
  </example>

  <!-- Example 3: Publicly exposing sensitive collection -->
  <example>
    <string name="bad_practice_public_profiles"><![CDATA[
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // BAD: everyone can read all profiles
    match /profiles/{userId} {
      allow read: if true;
      allow write: if request.auth.uid == userId;
    }
  }
}
    ]]></string>
    <string name="good_practice_restricted_profiles"><![CDATA[
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /profiles/{userId} {
      // Only the user themself or users in their friends list can read
      allow read: if request.auth != null
                  && (request.auth.uid == userId
                      || exists(/databases/$(database)/documents/friends/$(request.auth.uid)_$(userId)))
      allow update: if request.auth != null
                    && request.auth.uid == userId;
    }
  }
}
    ]]></string>
  </example>
</securityRulesExamples>

`;
