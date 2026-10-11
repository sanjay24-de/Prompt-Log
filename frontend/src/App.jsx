import { useState, useEffect } from "react";
import "./App.css";

function App() {
    const [name, setName] = useState("");
    const [content, setContent] = useState("");
    const [message, setMessage] = useState("");
    const [saved, setSaved] = useState(false);

    const [versions, setVersions] = useState([]);
    const [showVersions, setShowVersions] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [compareVersion, setCompareVersion] = useState(null);
    const [versionsError, setVersionsError] = useState("");

    const [showPrompts, setShowPrompts] = useState(false);
    const [savedPrompts, setSavedPrompts] = useState([]);
    const [promptsError, setPromptsError] = useState("");

    const [showRegression, setShowRegression] = useState(false);
    const [regressionTests, setRegressionTests] = useState([]);

    const [testName, setTestName] = useState("");
    const [testInput, setTestInput] = useState("");
    const [testExpected, setTestExpected] = useState("");

    const [regressionResults, setRegressionResults] = useState([]);
    const [runningTests, setRunningTests] = useState(false);

    const [showBaselines, setShowBaselines] = useState(false);
    const [baselines, setBaselines] = useState([]);
    const [selectedBaseline, setSelectedBaseline] = useState(null);
    const [baselinesError, setBaselinesError] = useState("");
    
    // Tags
    const [tags, setTags] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTag, setSelectedTag] = useState("");

    // Live LLM
    const [showLLM, setShowLLM] = useState(false);
    const [llmProvider, setLlmProvider] = useState("openai");
    const [llmApiKey, setLlmApiKey] = useState("");
    const [llmModel, setLlmModel] = useState("gpt-3.5-turbo");
    const [llmResult, setLlmResult] = useState("");
    const [runningLLM, setRunningLLM] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Analytics
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [analyticsData, setAnalyticsData] = useState([]);

    // Starter Templates State
    const [showTemplates, setShowTemplates] = useState(false);
    const [templatesList, setTemplatesList] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);

    // AI Prompt Optimizer State
    const [showOptimizerModal, setShowOptimizerModal] = useState(false);
    const [optimizingPrompt, setOptimizingPrompt] = useState(false);
    const [optimizedData, setOptimizedData] = useState(null);

    // Multi-Model Comparison State
    const [showMultiModelModal, setShowMultiModelModal] = useState(false);
    const [runningMultiModel, setRunningMultiModel] = useState(false);
    const [multiModelResults, setMultiModelResults] = useState([]);

    // Collaboration / Share State
    const [shareModal, setShareModal] = useState(null); // { promptName, shareToken, shareUrl, sharedAt }
    const [sharingPrompt, setSharingPrompt] = useState(null); // name of prompt being shared
    const [copySuccess, setCopySuccess] = useState(false);
    const [shareView, setShareView] = useState(null);  // { name, content, tags, sharedAt } — public viewer
    const [shareViewLoading, setShareViewLoading] = useState(false);
    const [shareViewError, setShareViewError] = useState("");

    // Authentication State
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const storedUser = localStorage.getItem("promptlog_user");
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (e) {
            return null;
        }
    });
    const [authMode, setAuthMode] = useState("login"); // 'login' or 'signup'
    const [authName, setAuthName] = useState("");
    const [authEmail, setAuthEmail] = useState("");
    const [authPassword, setAuthPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [authError, setAuthError] = useState("");
    const [authLoading, setAuthLoading] = useState(false);

    // Dark Mode
    const [darkMode, setDarkMode] = useState(false);

    const getUserInitials = (name) => {
        if (!name) return "PL";
        const parts = name.trim().split(" ");
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.slice(0, 2).toUpperCase();
    };

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        if (!authEmail.trim() || !authPassword) {
            setAuthError("Please enter both email and password.");
            return;
        }
        setAuthError("");
        setAuthLoading(true);
        try {
            const response = await fetch("http://localhost:5000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: authEmail, password: authPassword })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setCurrentUser(data.user);
                localStorage.setItem("promptlog_user", JSON.stringify(data.user));
                localStorage.setItem("promptlog_token", data.token);
                setAuthEmail("");
                setAuthPassword("");
            } else {
                setAuthError(data.message || "Invalid email or password");
            }
        } catch (err) {
            setAuthError("Could not connect to backend server");
        } finally {
            setAuthLoading(false);
        }
    };

    const handleSignUp = async (e) => {
        if (e) e.preventDefault();
        if (!authName.trim() || !authEmail.trim() || !authPassword) {
            setAuthError("Please fill in all fields.");
            return;
        }
        setAuthError("");
        setAuthLoading(true);
        try {
            const response = await fetch("http://localhost:5000/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: authName, email: authEmail, password: authPassword })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setCurrentUser(data.user);
                localStorage.setItem("promptlog_user", JSON.stringify(data.user));
                localStorage.setItem("promptlog_token", data.token);
                setAuthName("");
                setAuthEmail("");
                setAuthPassword("");
            } else {
                setAuthError(data.message || "Could not register account");
            }
        } catch (err) {
            setAuthError("Could not connect to backend server");
        } finally {
            setAuthLoading(false);
        }
    };

    const handleDemoLogin = async () => {
        setAuthError("");
        setAuthLoading(true);
        try {
            const response = await fetch("http://localhost:5000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: "demo@promptlog.com", password: "password123" })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setCurrentUser(data.user);
                localStorage.setItem("promptlog_user", JSON.stringify(data.user));
                localStorage.setItem("promptlog_token", data.token);
            } else {
                setAuthError("Demo account access error");
            }
        } catch (err) {
            setAuthError("Could not connect to server");
        } finally {
            setAuthLoading(false);
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        localStorage.removeItem("promptlog_user");
        localStorage.removeItem("promptlog_token");
    };

    useEffect(() => {
        const storedTheme = localStorage.getItem("theme");
        if (storedTheme === "dark") {
            setDarkMode(true);
            document.documentElement.setAttribute("data-theme", "dark");
        }
        
        const storedKey = localStorage.getItem("llmApiKey");
        if (storedKey) setLlmApiKey(storedKey);
        
        const storedProvider = localStorage.getItem("llmProvider");
        if (storedProvider) setLlmProvider(storedProvider);
        
        const storedModel = localStorage.getItem("llmModel");
        if (storedModel) setLlmModel(storedModel);

        loadRegressionTests();
        loadSavedPrompts();

        // Detect ?share=<token> in URL for public prompt viewer
        const params = new URLSearchParams(window.location.search);
        const shareToken = params.get("share");
        if (shareToken) {
            setShareViewLoading(true);
            fetch(`http://localhost:5000/api/share/${shareToken}`)
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        setShareView(data.prompt);
                    } else {
                        setShareViewError(data.message || "This share link is invalid or has been revoked.");
                        setShareView("error");
                    }
                })
                .catch(() => {
                    setShareViewError("Could not connect to server to load shared prompt.");
                    setShareView("error");
                })
                .finally(() => setShareViewLoading(false));
        }
    }, []);

    const toggleTheme = () => {
        setDarkMode(!darkMode);
        if (!darkMode) {
            document.documentElement.setAttribute("data-theme", "dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.removeAttribute("data-theme");
            localStorage.setItem("theme", "light");
        }
    };

    const loadRegressionTests = async () => {
        try {
            const response = await fetch(
                "http://localhost:5000/api/regression/tests"
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            setRegressionTests(data.tests || []);
        } catch (error) {
            console.log("Could not load regression tests.");
        }
    };

    const savePrompt = async (overwrite = false) => {
        if (!name.trim() || !content.trim()) {
            setMessage("Please enter a prompt name and prompt content.");
            setSaved(false);
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:5000/api/prompts",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name,
                        content,
                        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                        overwrite,
                    }),
                }
            );

            const data = await response.json();

            if (response.status === 409 && data.exists) {
                const confirmed = window.confirm(
                    data.message ||
                        "A prompt with this name already exists. Overwrite it?"
                );

                if (confirmed) {
                    await savePrompt(true);
                } else {
                    setMessage("Save cancelled.");
                    setSaved(false);
                }

                return;
            }

            if (!response.ok) {
                throw new Error(data.message);
            }

            setMessage(data.message || "Prompt saved successfully.");
            setSaved(true);

            if (showPrompts) {
                await loadSavedPrompts();
            }
        } catch (error) {
            console.error(error);
            setMessage(
                "Backend connection failed. Make sure the server is running."
            );
            setSaved(false);
        }
    };

    const clearPrompt = () => {
        setName("");
        setContent("");
        setTags("");
        setMessage("");
        setSaved(false);
    };

    const createSnapshot = async () => {
        if (!name.trim() || !content.trim()) {
            setMessage("Please enter a prompt before creating a snapshot.");
            setSaved(false);
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:5000/api/snapshot",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name,
                        content,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            setMessage(`Snapshot created: ${data.version || "successfully"}`);
            setSaved(true);

            await loadVersions();
        } catch (error) {
            console.error(error);
            setMessage("Could not create snapshot.");
            setSaved(false);
        }
    };

    const loadVersions = async () => {
        try {
            setVersionsError("");

            const response = await fetch(
                "http://localhost:5000/api/versions"
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            setVersions(data);
        } catch (error) {
            console.error(error);

            setVersionsError(
                "Could not load versions. Make sure the server is running."
            );
        }
    };

    const deleteVersion = async (id) => {
        try {
            const response = await fetch(
                `http://localhost:5000/api/versions/${id}`,
                {
                    method: "DELETE",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            await loadVersions();
        } catch (error) {
            console.error(error);
            setMessage("Could not delete version.");
            setSaved(false);
        }
    };

    const openVersions = async () => {
        setShowVersions(true);
        setShowRegression(false);
        setShowBaselines(false);
        setShowPrompts(false);
        setMessage("");
        await loadVersions();
    };

    const loadSavedPrompts = async () => {
        try {
            setPromptsError("");

            const response = await fetch(
                "http://localhost:5000/api/prompts"
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            setSavedPrompts(data.prompts || []);
        } catch (error) {
            console.error(error);

            setPromptsError(
                "Could not load saved prompts. Make sure the server is running."
            );
        }
    };

    const openPrompts = async () => {
        setShowPrompts(true);
        setShowVersions(false);
        setShowRegression(false);
        setShowBaselines(false);
        setMessage("");
        await loadSavedPrompts();
    };

    const loadPromptIntoEditor = (prompt) => {
        setName(prompt.name || "");
        setContent(prompt.content || "");
        setTags((prompt.tags || []).join(", "));
        setSaved(true);

        setMessage(`"${prompt.name}" loaded into the editor.`);
        setShowPrompts(false);
    };

    const deleteSavedPrompt = async (promptName) => {
        try {
            const response = await fetch(
                `http://localhost:5000/api/prompts/${promptName}`,
                {
                    method: "DELETE",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            await loadSavedPrompts();
        } catch (error) {
            console.error(error);
            setMessage("Could not delete prompt.");
            setSaved(false);
        }
    };

    const openRegression = () => {
        setShowRegression(true);
        setShowVersions(false);
        setShowBaselines(false);
        setShowPrompts(false);
        setMessage("");
        setRegressionResults([]);
    };

    const loadBaselines = async () => {
        try {
            setBaselinesError("");

            const response = await fetch(
                "http://localhost:5000/api/baselines"
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            setBaselines(data.baselines || []);
        } catch (error) {
            console.error(error);

            setBaselinesError(
                "Could not load baselines. Make sure the server is running."
            );
        }
    };

    const openBaselines = async () => {
        setShowBaselines(true);
        setShowVersions(false);
        setShowRegression(false);
        setShowPrompts(false);
        setMessage("");
        await loadBaselines();
    };

    const backToEditor = () => {
        setShowVersions(false);
        setShowRegression(false);
        setShowBaselines(false);
        setShowPrompts(false);
        setShowAnalytics(false);
        setShowTemplates(false);
        setSelectedVersion(null);
        setCompareVersion(null);
        setSelectedBaseline(null);
        setMessage("");
    };

    // ===========================
    // SHARE / COLLABORATION
    // ===========================

    const handleSharePrompt = async (promptName) => {
        setSharingPrompt(promptName);
        try {
            const safeName = promptName.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
            const response = await fetch(`http://localhost:5000/api/prompts/${safeName}/share`, {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setShareModal({
                    promptName,
                    shareToken: data.shareToken,
                    shareUrl: data.shareUrl,
                    sharedAt: data.sharedAt
                });
                // Refresh prompts list to show share badge
                await loadSavedPrompts();
            } else {
                setMessage(data.message || "Failed to generate share link.");
            }
        } catch (err) {
            setMessage("Error connecting to server to generate share link.");
        } finally {
            setSharingPrompt(null);
        }
    };

    const handleRevokeShare = async (promptName) => {
        try {
            const safeName = promptName.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
            const response = await fetch(`http://localhost:5000/api/prompts/${safeName}/share`, {
                method: "DELETE"
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setShareModal(null);
                setMessage("Share link revoked successfully.");
                await loadSavedPrompts();
            } else {
                setMessage(data.message || "Failed to revoke share link.");
            }
        } catch (err) {
            setMessage("Error revoking share link.");
        }
    };

    const handleCopyShareUrl = (url) => {
        navigator.clipboard.writeText(url).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2500);
        });
    };

    const viewVersion = (version) => {
        setSelectedVersion(version);
    };

    const closeVersion = () => {
        setSelectedVersion(null);
    };

    const restoreVersion = (version) => {
        setName(version.promptName || "");
        setContent(version.content || "");
        setSaved(false);

        setMessage(
            `Version ${version.versionNumber} restored to editor.`
        );

        setSelectedVersion(null);
        setCompareVersion(null);
        setShowVersions(false);
    };

    const getVersionNumber = (index) => {
        return versions.length - index;
    };

    const getPreviousVersion = (index) => {
        if (index >= versions.length - 1) {
            return null;
        }

        return versions[index + 1];
    };

    // =========================
    // TOKEN ESTIMATION
    // =========================
    // No tokenizer library is wired in, so this uses a
    // widely-used approximation for GPT/Claude-style BPE
    // tokenizers: average of a word-based estimate and a
    // character-based estimate. It will not exactly match
    // any specific model's tokenizer, but stays within a
    // reasonable margin for English prose and code.

    const estimateTokens = (text) => {
        if (!text || !text.trim()) {
            return 0;
        }

        const trimmed = text.trim();

        const wordCount = trimmed
            .split(/\s+/)
            .filter(Boolean).length;

        const charEstimate = trimmed.length / 4;
        const wordEstimate = wordCount * 1.3;

        const estimate = (charEstimate + wordEstimate) / 2;

        return Math.max(1, Math.round(estimate));
    };

    const getChangeSummary = (current, previous) => {
        if (!previous) {
            return "Initial prompt snapshot";
        }

        const currentText = current.content || "";
        const previousText = previous.content || "";

        if (currentText === previousText) {
            return "No content changes from previous version";
        }

        const currentWords = currentText.split(/\s+/);
        const previousWords = previousText.split(/\s+/);

        const added = currentWords.filter(
            (word) => !previousWords.includes(word)
        );

        const removed = previousWords.filter(
            (word) => !currentWords.includes(word)
        );

        if (added.length > 0 && removed.length > 0) {
            return `Modified prompt • +${added.length} words • -${removed.length} words`;
        }

        if (added.length > 0) {
            return `Added ${added.length} new word${
                added.length > 1 ? "s" : ""
            }`;
        }

        if (removed.length > 0) {
            return `Removed ${removed.length} word${
                removed.length > 1 ? "s" : ""
            }`;
        }

        return "Prompt content modified";
    };

    const openCompare = (version, previous) => {
        setCompareVersion({
            current: version,
            previous,
        });
    };

    const closeCompare = () => {
        setCompareVersion(null);
    };

    const visibleRegressionTests = regressionTests.filter(
        (test) =>
            (test.name && test.name.trim()) ||
            (test.input && test.input.trim()) ||
            (test.expected && test.expected.trim())
    );

    const addRegressionTest = async () => {
        if (
            !testName.trim() ||
            !testInput.trim() ||
            !testExpected.trim()
        ) {
            setMessage(
                "Please fill Test Name, Input and Expected Result."
            );
            setSaved(false);
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:5000/api/regression/tests",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: testName,
                        input: testInput,
                        expected: testExpected,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            await loadRegressionTests();

            setTestName("");
            setTestInput("");
            setTestExpected("");

            setMessage("Regression test added successfully.");
            setSaved(true);
        } catch (error) {
            console.error(error);

            const newTest = {
                id: Date.now(),
                name: testName,
                input: testInput,
                expected: testExpected,
            };

            setRegressionTests((prev) => [...prev, newTest]);

            setTestName("");
            setTestInput("");
            setTestExpected("");

            setMessage(
                "Backend unavailable — test added locally only."
            );

            setSaved(false);
        }
    };

    const deleteRegressionTest = async (id) => {
        setRegressionTests((prev) =>
            prev.filter((test) => test.id !== id)
        );

        setRegressionResults((prev) =>
            prev.filter((result) => result.id !== id)
        );

        try {
            await fetch(
                `http://localhost:5000/api/regression/tests/${id}`,
                {
                    method: "DELETE",
                }
            );
        } catch (error) {
            console.log("Backend unavailable.");
        }
    };

    const runRegressionTests = async () => {
        if (!content.trim()) {
            setMessage(
                "Please create or enter a prompt before running regression tests."
            );
            setSaved(false);
            return;
        }

        if (visibleRegressionTests.length === 0) {
            setMessage("Please add at least one regression test.");
            setSaved(false);
            return;
        }

        setRunningTests(true);
        setRegressionResults([]);

        try {
            const response = await fetch(
                "http://localhost:5000/api/regression/run",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        promptName: name,
                        promptContent: content,
                        tests: visibleRegressionTests,
                    }),
                }
            );

            if (response.ok) {
                const data = await response.json();

                setRegressionResults(data.results || []);
                setMessage(
                    "Regression tests completed successfully."
                );

                try {
                    const passed = (data.results || []).filter(r => r.status === "PASS").length;
                    const failed = (data.results || []).filter(r => r.status === "FAIL").length;
                    await fetch("http://localhost:5000/api/analytics/log", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            promptName: name || "Untitled",
                            passedTests: passed,
                            failedTests: failed
                        })
                    });
                } catch (e) {}

                setSaved(true);
                setRunningTests(false);
                return;
            }
        } catch (error) {
            console.log("Backend regression endpoint unavailable.");
        }

        const promptText = content.toLowerCase();

        const localResults = visibleRegressionTests.map((test) => {
            const expectedWords = (test.expected || "")
                .toLowerCase()
                .split(/[,\s]+/)
                .filter(Boolean);

            const matchedWords = expectedWords.filter((word) =>
                promptText.includes(word)
            );

            const passed =
                expectedWords.length > 0 &&
                matchedWords.length === expectedWords.length;

            return {
                id: test.id,
                name: test.name,
                input: test.input,
                expected: test.expected,
                status: passed ? "PASS" : "FAIL",
                details: passed
                    ? "Expected behavior detected."
                    : "Expected behavior not detected.",
            };
        });

        setRegressionResults(localResults);

        setMessage(
            "Regression tests completed using local validation."
        );

        setSaved(true);
        setRunningTests(false);
    };

    const totalTests = regressionResults.length;

    const passedTests = regressionResults.filter(
        (result) => result.status === "PASS"
    ).length;

    const failedTests = regressionResults.filter(
        (result) => result.status === "FAIL"
    ).length;

    const saveAsBaseline = async () => {
        if (!name.trim() || !content.trim()) {
            setMessage(
                "Please enter a prompt before saving a baseline."
            );

            setSaved(false);
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:5000/api/baselines",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: `${name} baseline`,
                        promptName: name,
                        content,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            setMessage("Baseline saved successfully.");
            setSaved(true);

            await loadBaselines();
        } catch (error) {
            console.error(error);

            setMessage(
                "Could not save baseline. Make sure the server is running."
            );

            setSaved(false);
        }
    };

    const deleteBaseline = async (id) => {
        try {
            const response = await fetch(
                `http://localhost:5000/api/baselines/${id}`,
                {
                    method: "DELETE",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            await loadBaselines();
        } catch (error) {
            console.error(error);
            setMessage("Could not delete baseline.");
        }
    };

    const viewBaseline = (baseline) => {
        setSelectedBaseline(baseline);
    };

    const closeBaselineView = () => {
        setSelectedBaseline(null);
    };

    const restoreBaseline = (baseline) => {
        setName(baseline.promptName || "");
        setContent(baseline.content || "");
        setSaved(false);

        setMessage("Baseline restored to editor.");

        setSelectedBaseline(null);
        setShowBaselines(false);
    };

    const exportPrompts = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedPrompts, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "prompts_export.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const importPrompts = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const prompts = JSON.parse(event.target.result);
                const response = await fetch("http://localhost:5000/api/prompts/import", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompts })
                });
                if (response.ok) {
                    setMessage("Prompts imported successfully!");
                    await loadSavedPrompts();
                } else {
                    setMessage("Failed to import prompts.");
                }
            } catch (err) {
                setMessage("Invalid JSON file.");
            }
        };
        reader.readAsText(file);
    };

    const executeLLM = async () => {
        if (!llmApiKey) {
            setShowSettings(true);
            return;
        }
        setRunningLLM(true);
        setLlmResult("");
        try {
            const response = await fetch("http://localhost:5000/api/execute-prompt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider: llmProvider,
                    apiKey: llmApiKey,
                    model: llmModel,
                    content
                })
            });
            const data = await response.json();
            if (response.ok) {
                setLlmResult(data.result);
            } else {
                setLlmResult("Error: " + data.message);
            }
        } catch (err) {
            setLlmResult("Error connecting to execution endpoint.");
        }
        setRunningLLM(false);
    };

    const openAnalytics = async () => {
        setShowAnalytics(true);
        setShowVersions(false);
        setShowRegression(false);
        setShowBaselines(false);
        setShowPrompts(false);
        try {
            const response = await fetch("http://localhost:5000/api/analytics");
            const data = await response.json();
            if (response.ok) {
                setAnalyticsData(data.stats);
            }
        } catch (e) {
            console.error("Could not load analytics.");
        }
    };

    // Feature Handlers
    const openTemplates = async () => {
        setShowTemplates(true);
        setShowVersions(false);
        setShowRegression(false);
        setShowBaselines(false);
        setShowPrompts(false);
        setShowAnalytics(false);
        setLoadingTemplates(true);
        try {
            const response = await fetch("http://localhost:5000/api/templates");
            const data = await response.json();
            if (response.ok && data.success) {
                setTemplatesList(data.templates || []);
            }
        } catch (e) {
            console.error("Could not load templates.");
        } finally {
            setLoadingTemplates(false);
        }
    };

    const loadTemplateIntoEditor = (tpl) => {
        setName(tpl.name || "");
        setContent(tpl.content || "");
        setTags(tpl.tags ? tpl.tags.join(", ") : "");
        setShowTemplates(false);
        setSaved(false);
        setMessage(`Loaded template "${tpl.name}" into editor.`);
    };

    const handleOptimizePrompt = async () => {
        if (!content || !content.trim()) {
            setMessage("Please enter or draft a prompt before optimizing.");
            setSaved(false);
            return;
        }
        setOptimizingPrompt(true);
        try {
            const response = await fetch("http://localhost:5000/api/optimize-prompt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content, name })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setOptimizedData(data);
                setShowOptimizerModal(true);
            } else {
                setMessage(data.message || "Failed to optimize prompt.");
            }
        } catch (err) {
            setMessage("Error connecting to optimization endpoint.");
        } finally {
            setOptimizingPrompt(false);
        }
    };

    const applyOptimizedPrompt = () => {
        if (optimizedData && optimizedData.optimizedContent) {
            setContent(optimizedData.optimizedContent);
            setSaved(false);
            setMessage("🪄 Applied optimized prompt structure to editor!");
            setShowOptimizerModal(false);
        }
    };

    const executeMultiModel = async () => {
        if (!content || !content.trim()) {
            setMessage("Please enter a prompt before running multi-model comparison.");
            setSaved(false);
            return;
        }
        setRunningMultiModel(true);
        setShowMultiModelModal(true);
        try {
            const response = await fetch("http://localhost:5000/api/execute-multi-model", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content, name })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setMultiModelResults(data.results || []);
            } else {
                setMessage("Multi-model execution error: " + data.message);
            }
        } catch (err) {
            setMessage("Error connecting to multi-model endpoint.");
        } finally {
            setRunningMultiModel(false);
        }
    };

    // ============================================
    // PUBLIC SHARE VIEWER (no login needed)
    // ============================================
    if (shareViewLoading) {
        return (
            <div className="share-viewer-shell">
                <div className="share-viewer-loading">
                    <div className="share-spinner"></div>
                    <p>Loading shared prompt...</p>
                </div>
            </div>
        );
    }

    if (shareView === "error") {
        return (
            <div className="share-viewer-shell">
                <div className="share-viewer-error">
                    <div className="share-error-icon">🔒</div>
                    <h2>Link Not Found</h2>
                    <p>{shareViewError}</p>
                    <button className="share-viewer-cta" onClick={() => window.location.href = "/"}>
                        Go to Prompt-Log Studio →
                    </button>
                </div>
            </div>
        );
    }

    if (shareView && shareView !== "error") {
        return (
            <div className="share-viewer-shell">
                <div className="share-viewer-topbar">
                    <div className="share-viewer-brand">
                        <span className="brand-icon-sm">◈</span>
                        <span className="brand-text-sm">Prompt-Log <span>Studio</span></span>
                    </div>
                    <div className="share-viewer-badge">
                        <span className="pill-dot"></span>
                        Shared Prompt — Read Only
                    </div>
                </div>

                <div className="share-viewer-card">
                    <div className="share-viewer-header">
                        <div>
                            <div className="share-viewer-kicker">SHARED PROMPT</div>
                            <h1 className="share-viewer-title">{shareView.name}</h1>
                            {shareView.sharedAt && (
                                <p className="share-viewer-date">
                                    🕒 Shared on {new Date(shareView.sharedAt).toLocaleString()}
                                </p>
                            )}
                        </div>
                        {shareView.tags && shareView.tags.length > 0 && (
                            <div className="share-viewer-tags">
                                {shareView.tags.map((tag, i) => (
                                    <span key={i} className="share-tag-pill">{tag}</span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="share-viewer-content">
                        <pre className="share-viewer-pre">{shareView.content}</pre>
                    </div>

                    <div className="share-viewer-footer">
                        <div className="share-viewer-meta">
                            <span>📄 {shareView.content ? shareView.content.length : 0} characters</span>
                            <span>·</span>
                            <span>🔒 Read-only view</span>
                        </div>
                        <div className="share-viewer-actions">
                            {currentUser ? (
                                <button
                                    className="share-load-btn"
                                    onClick={() => {
                                        setName(shareView.name);
                                        setContent(shareView.content);
                                        setTags((shareView.tags || []).join(", "));
                                        setShareView(null);
                                        window.history.replaceState({}, "", "/");
                                    }}
                                >
                                    📥 Load into My Workspace
                                </button>
                            ) : (
                                <button
                                    className="share-viewer-cta"
                                    onClick={() => window.history.replaceState({}, "", "/")}
                                >
                                    🚀 Open in Prompt-Log Studio
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="share-viewer-powered">
                    Powered by <strong>Prompt-Log Studio</strong>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="super-auth-container">
                <div className="glow glow-one"></div>
                <div className="glow glow-two"></div>
                <div className="glow glow-three"></div>
                <div className="auth-grid-bg"></div>

                {/* Topbar */}
                <div className="auth-topbar">
                    <div className="brand-logo-inline">
                        <span className="brand-icon-sm">◈</span>
                        <span className="brand-text-sm">Prompt-Log <span>Studio</span></span>
                    </div>

                    <div className="auth-topbar-actions">
                        <span className="hero-status-pill">
                            <span className="pill-dot"></span>
                            System v1.0 Active
                        </span>
                        <button className="auth-theme-toggle" onClick={toggleTheme}>
                            {darkMode ? '☀️ Light' : '🌙 Dark'}
                        </button>
                    </div>
                </div>

                {/* Main Split Layout */}
                <div className="super-auth-content">

                    {/* Left Panel: Hero Showcase */}
                    <div className="auth-hero-panel">
                        <div className="hero-badge">
                            <span className="hero-sparkle">✨</span> Enterprise AI Workspace
                        </div>

                        <h1 className="hero-headline">
                            Architect, Version & Test <span className="gradient-text">AI Prompts</span> with Confidence.
                        </h1>

                        <p className="hero-description">
                            The ultimate prompt engineering suite built for developers and AI teams. Track prompt versions, run automated regression tests, and execute across LLMs.
                        </p>

                        {/* Interactive Code Preview Box */}
                        <div className="hero-code-box">
                            <div className="code-box-header">
                                <div className="code-dots">
                                    <span className="dot red"></span>
                                    <span className="dot yellow"></span>
                                    <span className="dot green"></span>
                                </div>
                                <span className="code-box-title">prompt_config.json — Production</span>
                                <span className="code-status-pill">PASS (100%)</span>
                            </div>
                            <pre className="code-box-content">
<code>{`{
  "prompt_id": "customer_support_v2.4",
  "model": "gpt-4-turbo",
  "temperature": 0.3,
  "tokens": 420,
  "regression_suite": "14/14 PASSED",
  "status": "READY_FOR_DEPLOYMENT"
}`}</code>
                            </pre>
                        </div>

                        {/* Metrics Bar */}
                        <div className="hero-metrics">
                            <div className="metric-item">
                                <strong>10x</strong>
                                <span>Faster Iteration</span>
                            </div>
                            <div className="metric-divider"></div>
                            <div className="metric-item">
                                <strong>100%</strong>
                                <span>Regression Guard</span>
                            </div>
                            <div className="metric-divider"></div>
                            <div className="metric-item">
                                <strong>Multi-LLM</strong>
                                <span>OpenAI & Anthropic</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Authentication Card */}
                    <div className="auth-card-wrapper">
                        <div className="auth-card">

                            <div className="auth-card-header">
                                <h2>{authMode === "login" ? "Welcome Back" : "Start Building"}</h2>
                                <p>{authMode === "login" ? "Enter your credentials to access your studio workspace" : "Create your account to start managing prompt versions"}</p>
                            </div>

                            <div className="auth-tabs">
                                <button
                                    className={authMode === "login" ? "auth-tab active" : "auth-tab"}
                                    onClick={() => { setAuthMode("login"); setAuthError(""); }}
                                >
                                    Log In
                                </button>
                                <button
                                    className={authMode === "signup" ? "auth-tab active" : "auth-tab"}
                                    onClick={() => { setAuthMode("signup"); setAuthError(""); }}
                                >
                                    Create Account
                                </button>
                            </div>

                            {authError && (
                                <div className="error-message auth-error-banner">
                                    <span>⚠️</span>
                                    <div>{authError}</div>
                                </div>
                            )}

                            {authMode === "login" ? (
                                <form className="auth-form" onSubmit={handleLogin}>
                                    <div className="field">
                                        <label>Work Email</label>
                                        <div className="input-with-icon">
                                            <span className="input-icon">✉</span>
                                            <input
                                                type="email"
                                                placeholder="alex@company.com"
                                                value={authEmail}
                                                onChange={(e) => setAuthEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="field">
                                        <div className="label-row">
                                            <label>Password</label>
                                            <span className="forgot-link" onClick={handleDemoLogin}>Need Quick Pass?</span>
                                        </div>
                                        <div className="input-with-icon">
                                            <span className="input-icon">🔒</span>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={authPassword}
                                                onChange={(e) => setAuthPassword(e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="toggle-password-btn"
                                                onClick={() => setShowPassword(!showPassword)}
                                                title={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? "🙈" : "👁️"}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="auth-submit-btn"
                                        disabled={authLoading}
                                    >
                                        {authLoading ? (
                                            <span className="btn-loading"><span>⏳</span> Signing In...</span>
                                        ) : (
                                            <span>Sign In to Workspace &rarr;</span>
                                        )}
                                    </button>
                                </form>
                            ) : (
                                <form className="auth-form" onSubmit={handleSignUp}>
                                    <div className="field">
                                        <label>Full Name</label>
                                        <div className="input-with-icon">
                                            <span className="input-icon">👤</span>
                                            <input
                                                type="text"
                                                placeholder="Alex Morgan"
                                                value={authName}
                                                onChange={(e) => setAuthName(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="field">
                                        <label>Work Email</label>
                                        <div className="input-with-icon">
                                            <span className="input-icon">✉</span>
                                            <input
                                                type="email"
                                                placeholder="alex@company.com"
                                                value={authEmail}
                                                onChange={(e) => setAuthEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="field">
                                        <label>Password</label>
                                        <div className="input-with-icon">
                                            <span className="input-icon">🔒</span>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Min 6 characters"
                                                value={authPassword}
                                                onChange={(e) => setAuthPassword(e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="toggle-password-btn"
                                                onClick={() => setShowPassword(!showPassword)}
                                                title={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? "🙈" : "👁️"}
                                            </button>
                                        </div>
                                        <div className="password-hint">
                                            <span className={authPassword.length >= 6 ? "hint-check active" : "hint-check"}>
                                                {authPassword.length >= 6 ? "✓" : "○"} At least 6 characters
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="auth-submit-btn"
                                        disabled={authLoading}
                                    >
                                        {authLoading ? (
                                            <span className="btn-loading"><span>⏳</span> Creating Account...</span>
                                        ) : (
                                            <span>Create Free Account &rarr;</span>
                                        )}
                                    </button>
                                </form>
                            )}

                            <div className="auth-divider">
                                <span>OR QUICK TRY</span>
                            </div>

                            <button
                                type="button"
                                className="demo-login-btn"
                                onClick={handleDemoLogin}
                                disabled={authLoading}
                            >
                                <span className="demo-flash">⚡</span>
                                <span>Launch 1-Click Demo Workspace</span>
                            </button>

                            <div className="auth-footer-note">
                                🛡️ Encrypted & ISO-compliant session storage — Prompt-Log Studio
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        );
    }

    return (
        <div className="app-shell">

            <div className="glow glow-one"></div>
            <div className="glow glow-two"></div>

            <aside className="sidebar">

                <div className="brand">
                    <div className="brand-icon">◈</div>

                    <div>
                        <h2>Prompt-Log</h2>
                        <span>AI Prompt Engineering</span>
                    </div>
                </div>

                <div className="menu-section">

                    <p className="menu-title">WORKSPACE</p>

                    <div
                        className={
                            !showVersions &&
                            !showRegression &&
                            !showBaselines &&
                            !showPrompts
                                ? "menu-item active"
                                : "menu-item"
                        }
                        onClick={backToEditor}
                    >
                        <span>⌂</span>
                        Dashboard
                    </div>

                    <div
                        className={
                            showPrompts
                                ? "menu-item active"
                                : "menu-item"
                        }
                        onClick={openPrompts}
                    >
                        <span>◇</span>
                        Prompts
                    </div>

                    <div
                        className={
                            showVersions
                                ? "menu-item active"
                                : "menu-item"
                        }
                        onClick={openVersions}
                    >
                        <span>◈</span>
                        Versions
                    </div>

                    <div
                        className={
                            showRegression
                                ? "menu-item active"
                                : "menu-item"
                        }
                        onClick={openRegression}
                    >
                        <span>✓</span>
                        Regression Tests
                    </div>

                    <div
                        className={
                            showBaselines
                                ? "menu-item active"
                                : "menu-item"
                        }
                        onClick={openBaselines}
                    >
                        <span>▣</span>
                        Baselines
                    </div>

                    <div
                        className={
                            showAnalytics
                                ? "menu-item active"
                                : "menu-item"
                        }
                        onClick={openAnalytics}
                    >
                        <span>📊</span>
                        Analytics
                    </div>

                    <div
                        className={
                            showTemplates
                                ? "menu-item active"
                                : "menu-item"
                        }
                        onClick={openTemplates}
                    >
                        <span>📚</span>
                        Template Library
                    </div>

                    <div
                        className="menu-item"
                        onClick={openPrompts}
                        title="Prompts with active share links"
                    >
                        <span>🔗</span>
                        Shared Prompts
                        {savedPrompts.filter(p => p.shareToken).length > 0 && (
                            <span className="share-count-badge">
                                {savedPrompts.filter(p => p.shareToken).length}
                            </span>
                        )}
                    </div>

                </div>

                <div className="sidebar-bottom">
                    <button className="button button-outline" onClick={toggleTheme} style={{width: '100%', marginBottom: '16px'}}>
                        {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
                    </button>

                    <div className="user-badge" style={{ marginBottom: "12px" }}>
                        <div className="user-badge-avatar">
                            {getUserInitials(currentUser.name)}
                        </div>
                        <div className="user-badge-info">
                            <strong>{currentUser.name}</strong>
                            <small>{currentUser.email}</small>
                        </div>
                    </div>

                    <button className="logout-btn" onClick={handleLogout}>
                        🚪 Log Out
                    </button>

                </div>

            </aside>

            <main className="main-content">

                <header className="topbar">

                    <div>

                        <p className="breadcrumb">
                            Workspace /{" "}
                            {showRegression
                                ? "Regression Tests"
                                : showVersions
                                ? "Versions"
                                : showBaselines
                                ? "Baselines"
                                : showPrompts
                                ? "Prompts"
                                : "Prompts / Editor"}
                        </p>

                        <h1>
                            {showRegression
                                ? "Regression Testing"
                                : showVersions
                                ? "Version History"
                                : showBaselines
                                ? "Prompt Baselines"
                                : showPrompts
                                ? "Saved Prompts"
                                : "Prompt Workspace"}
                        </h1>

                    </div>

                    <div className="topbar-right">

                        <div className="online-pill">
                            <span></span>
                            Local Environment
                        </div>

                        <div className="avatar" title={currentUser.name}>
                            {getUserInitials(currentUser.name)}
                        </div>

                    </div>

                </header>

                <section className="stats">

                    <div className="stat-card">

                        <div className="stat-icon purple">
                            ◇
                        </div>

                        <div>
                            <span>Prompt Status</span>

                            <strong>
                                {saved ? "Saved" : "Draft"}
                            </strong>
                        </div>

                    </div>

                    <div className="stat-card">

                        <div className="stat-icon blue">
                            #
                        </div>

                        <div>
                            <span>Characters</span>

                            <strong>
                                {content.length}
                            </strong>
                        </div>

                    </div>

                    <div className="stat-card">

                        <div className="stat-icon amber">
                            ⚡
                        </div>

                        <div>
                            <span>Est. Tokens</span>

                            <strong>
                                {estimateTokens(content)}
                            </strong>
                        </div>

                    </div>

                    <div className="stat-card">

                        <div className="stat-icon green">
                            ✓
                        </div>

                        <div>
                            <span>Environment</span>
                            <strong>Local</strong>
                        </div>

                    </div>

                </section>

                {showRegression ? (

                    <section className="regression-page">

                        <div className="regression-header">

                            <div>

                                <div className="editor-title">
                                    Regression Test Suite
                                </div>

                                <div className="editor-subtitle">
                                    Validate prompt behavior against predefined test cases
                                </div>

                            </div>

                            <button
                                className="back-btn"
                                onClick={backToEditor}
                            >
                                ← Back to Editor
                            </button>

                        </div>

                        <div className="regression-overview">

                            <div className="regression-stat">
                                <span>TOTAL TESTS</span>
                                <strong>
                                    {visibleRegressionTests.length}
                                </strong>
                            </div>

                            <div className="regression-stat">
                                <span>PASSED</span>

                                <strong className="pass-number">
                                    {passedTests}
                                </strong>
                            </div>

                            <div className="regression-stat">
                                <span>FAILED</span>

                                <strong className="fail-number">
                                    {failedTests}
                                </strong>
                            </div>

                            <div className="regression-stat">
                                <span>STATUS</span>

                                <strong>
                                    {totalTests === 0
                                        ? "NOT RUN"
                                        : failedTests === 0
                                        ? "STABLE"
                                        : "ISSUES"}
                                </strong>
                            </div>

                        </div>

                        <div className="regression-card">

                            <div className="regression-card-header">

                                <div>

                                    <h2>Add Regression Test</h2>

                                    <p>
                                        Define expected behavior for your prompt
                                    </p>

                                </div>

                                <span className="test-badge">
                                    TEST CASE
                                </span>

                            </div>

                            <div className="regression-form">

                                <div className="field">

                                    <label>TEST NAME</label>

                                    <input
                                        type="text"
                                        placeholder="e.g. Greeting Test"
                                        value={testName}
                                        onChange={(e) =>
                                            setTestName(e.target.value)
                                        }
                                    />

                                </div>

                                <div className="field">

                                    <label>
                                        INPUT / SCENARIO
                                    </label>

                                    <input
                                        type="text"
                                        placeholder="e.g. User says hello"
                                        value={testInput}
                                        onChange={(e) =>
                                            setTestInput(e.target.value)
                                        }
                                    />

                                </div>

                                <div className="field">

                                    <label>
                                        EXPECTED KEYWORD
                                    </label>

                                    <input
                                        type="text"
                                        placeholder="e.g. hello"
                                        value={testExpected}
                                        onChange={(e) =>
                                            setTestExpected(e.target.value)
                                        }
                                    />

                                </div>

                            </div>

                            <button
                                className="add-test-btn"
                                onClick={addRegressionTest}
                            >
                                + Add Test Case
                            </button>

                        </div>

                        <div className="regression-card">

                            <div className="regression-card-header">

                                <div>

                                    <h2>Test Cases</h2>

                                    <p>
                                        Tests used to validate prompt stability
                                    </p>

                                </div>

                                <button
                                    className="run-tests-btn"
                                    onClick={runRegressionTests}
                                    disabled={runningTests}
                                >
                                    {runningTests
                                        ? "Running..."
                                        : "▶ Run Regression Tests"}
                                </button>

                            </div>

                            {visibleRegressionTests.length === 0 ? (

                                <div className="regression-empty">

                                    <div>◈</div>

                                    <h3>No test cases</h3>

                                    <p>
                                        Add a regression test to begin validation.
                                    </p>

                                </div>

                            ) : (

                                <div className="test-list">

                                    {visibleRegressionTests.map(
                                        (test, index) => {

                                            const result =
                                                regressionResults.find(
                                                    (item) =>
                                                        item.id === test.id
                                                );

                                            return (

                                                <div
                                                    className="test-item"
                                                    key={test.id}
                                                >

                                                    <div className="test-number">
                                                        {String(
                                                            index + 1
                                                        ).padStart(2, "0")}
                                                    </div>

                                                    <div className="test-details">

                                                        <div className="test-name-row">

                                                            <h3>
                                                                {test.name ||
                                                                    "Untitled test"}
                                                            </h3>

                                                            {result && (
                                                                <span
                                                                    className={
                                                                        result.status ===
                                                                        "PASS"
                                                                            ? "test-result pass"
                                                                            : "test-result fail"
                                                                    }
                                                                >
                                                                    {result.status}
                                                                </span>
                                                            )}

                                                        </div>

                                                        <p>
                                                            <strong>
                                                                Input:
                                                            </strong>{" "}
                                                            {test.input || "—"}
                                                        </p>

                                                        <p>
                                                            <strong>
                                                                Expected:
                                                            </strong>{" "}
                                                            {test.expected || "—"}
                                                        </p>

                                                        {result && (
                                                            <div className="result-details">
                                                                {result.details}
                                                            </div>
                                                        )}

                                                    </div>

                                                    <button
                                                        className="delete-test-btn"
                                                        onClick={() =>
                                                            deleteRegressionTest(
                                                                test.id
                                                            )
                                                        }
                                                    >
                                                        ×
                                                    </button>

                                                </div>
                                            );
                                        }
                                    )}

                                </div>
                            )}

                        </div>

                    </section>

                ) : showBaselines ? (

                    <section className="baselines-page">

                        <div className="baselines-header">

                            <div>

                                <div className="editor-title">
                                    Prompt Baselines
                                </div>

                                <div className="editor-subtitle">
                                    Approved prompt versions to test future changes against
                                </div>

                            </div>

                            <button
                                className="back-btn"
                                onClick={backToEditor}
                            >
                                ← Back to Editor
                            </button>

                        </div>

                        {baselinesError ? (

                            <div className="baseline-empty">

                                <div>!</div>

                                <h3>Couldn't load baselines</h3>

                                <p>{baselinesError}</p>

                            </div>

                        ) : baselines.length === 0 ? (

                            <div className="baseline-empty">

                                <div>▣</div>

                                <h3>No baselines yet</h3>

                                <p>
                                    Save your current prompt as a baseline
                                    from the editor to see it here.
                                </p>

                            </div>

                        ) : (

                            <div className="baseline-list">

                                {baselines.map((baseline) => (

                                    <div
                                        className="baseline-card"
                                        key={baseline.id}
                                    >

                                        <div className="baseline-icon">
                                            ▣
                                        </div>

                                        <div className="baseline-details">

                                            <div className="baseline-top">

                                                <h3>
                                                    {baseline.name}
                                                </h3>

                                                <span className="baseline-date">

                                                    {baseline.createdAt
                                                        ? new Date(
                                                            baseline.createdAt
                                                        ).toLocaleString()
                                                        : "Unknown date"}

                                                </span>

                                            </div>

                                            {baseline.promptName && (
                                                <div className="baseline-prompt-tag">
                                                    {baseline.promptName}
                                                </div>
                                            )}

                                            <p>
                                                {baseline.content
                                                    ? baseline.content.substring(
                                                        0,
                                                        140
                                                    )
                                                    : ""}
                                                {baseline.content &&
                                                baseline.content.length > 140
                                                    ? "..."
                                                    : ""}
                                            </p>

                                            <div className="baseline-actions">

                                                <button
                                                    className="view-btn"
                                                    onClick={() =>
                                                        viewBaseline(
                                                            baseline
                                                        )
                                                    }
                                                >
                                                    View Prompt
                                                </button>

                                                <button
                                                    className="delete-baseline-btn"
                                                    onClick={() =>
                                                        deleteBaseline(
                                                            baseline.id
                                                        )
                                                    }
                                                >
                                                    Delete
                                                </button>

                                            </div>

                                        </div>

                                    </div>

                                ))}

                            </div>
                        )}

                    </section>

                ) : showVersions ? (

                    <section className="versions-page">

                        <div className="versions-header">

                            <div>

                                <div className="editor-title">
                                    Version History
                                </div>

                                <div className="editor-subtitle">
                                    Track how your prompt changes over time
                                </div>

                            </div>

                            <button
                                className="back-btn"
                                onClick={backToEditor}
                            >
                                ← Back to Editor
                            </button>

                        </div>

                        {versionsError ? (

                            <div className="empty-state">

                                <div className="empty-icon">!</div>

                                <h3>Couldn't load versions</h3>

                                <p>{versionsError}</p>

                            </div>

                        ) : versions.length === 0 ? (

                            <div className="empty-state">

                                <div className="empty-icon">◈</div>

                                <h3>No snapshots yet</h3>

                                <p>
                                    Create a snapshot from the prompt editor
                                    to see it here.
                                </p>

                            </div>

                        ) : (

                            <div className="version-list">

                                {versions.map((version, index) => {

                                    const versionNumber =
                                        getVersionNumber(index);

                                    const previousVersion =
                                        getPreviousVersion(index);

                                    const changeSummary =
                                        getChangeSummary(
                                            version,
                                            previousVersion
                                        );

                                    return (

                                        <div
                                            className="version-card"
                                            key={version.id}
                                        >

                                            <div className="version-icon">
                                                ◈
                                            </div>

                                            <div className="version-details">

                                                <div className="version-top">

                                                    <div className="version-labels">

                                                        <span className="version-number">
                                                            VERSION{" "}
                                                            {versionNumber}
                                                        </span>

                                                        {index === 0 && (
                                                            <span className="latest-badge">
                                                                LATEST
                                                            </span>
                                                        )}

                                                    </div>

                                                    <span className="version-date">

                                                        {version.createdAt
                                                            ? new Date(
                                                                version.createdAt
                                                            ).toLocaleString()
                                                            : "Unknown date"}

                                                    </span>

                                                </div>

                                                <h3>
                                                    {version.promptName}
                                                </h3>

                                                <div className="change-summary">
                                                    {changeSummary}
                                                </div>

                                                <p>
                                                    {version.content
                                                        ? version.content.substring(
                                                            0,
                                                            140
                                                        )
                                                        : ""}
                                                    {version.content &&
                                                    version.content.length > 140
                                                        ? "..."
                                                        : ""}
                                                </p>

                                                <div className="version-actions">

                                                    <button
                                                        className="view-btn"
                                                        onClick={() =>
                                                            viewVersion({
                                                                ...version,
                                                                versionNumber,
                                                            })
                                                        }
                                                    >
                                                        View Prompt
                                                    </button>

                                                    {previousVersion && (
                                                        <button
                                                            className="compare-btn"
                                                            onClick={() =>
                                                                openCompare(
                                                                    {
                                                                        ...version,
                                                                        versionNumber,
                                                                    },
                                                                    {
                                                                        ...previousVersion,
                                                                        versionNumber:
                                                                            versionNumber -
                                                                            1,
                                                                    }
                                                                )
                                                            }
                                                        >
                                                            Compare
                                                        </button>
                                                    )}

                                                    <button
                                                        className="delete-baseline-btn"
                                                        onClick={() =>
                                                            deleteVersion(
                                                                version.id
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </button>

                                                </div>

                                            </div>

                                        </div>
                                    );
                                })}

                            </div>
                        )}

                    </section>

                ) : showPrompts ? (

                    <section className="baselines-page">

                            <div className="baselines-header" style={{flexDirection: 'column', alignItems: 'stretch', gap: '16px'}}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                    <div>
                                        <div className="editor-title">Saved Prompts</div>
                                        <div className="editor-subtitle">Prompts you've saved from the editor</div>
                                    </div>
                                    <button className="back-btn" onClick={backToEditor}>← Back to Editor</button>
                                </div>
                                <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
                                    <input 
                                        type="text" 
                                        placeholder="Search prompts..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{flex: 1, padding: '8px 12px', background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-h)'}}
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Filter by tag..." 
                                        value={selectedTag}
                                        onChange={(e) => setSelectedTag(e.target.value)}
                                        style={{width: '150px', padding: '8px 12px', background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-h)'}}
                                    />
                                    <button onClick={exportPrompts} className="button" style={{padding: '8px 12px', border: '1px solid var(--border)', background: 'transparent', borderRadius: '4px', color: 'var(--text-h)', cursor: 'pointer'}}>📥 Export</button>
                                    <label className="button" style={{padding: '8px 12px', border: '1px solid var(--border)', background: 'transparent', borderRadius: '4px', color: 'var(--text-h)', cursor: 'pointer'}}>
                                        📤 Import
                                        <input type="file" accept=".json" style={{display: 'none'}} onChange={importPrompts} />
                                    </label>
                                </div>
                            </div>

                        {promptsError ? (

                            <div className="baseline-empty">
                                <div>!</div>
                                <h3>Couldn't load prompts</h3>
                                <p>{promptsError}</p>
                            </div>

                        ) : savedPrompts.length === 0 ? (

                            <div className="baseline-empty">
                                <div>◇</div>
                                <h3>No saved prompts yet</h3>
                                <p>Save a prompt from the editor to see it here.</p>
                            </div>

                        ) : (

                            <div className="baseline-list">

                                {savedPrompts.filter(p => {
                                    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.content || '').toLowerCase().includes(searchQuery.toLowerCase());
                                    const matchesTag = !selectedTag ? true : (p.tags || []).some(t => t.toLowerCase().includes(selectedTag.toLowerCase()));
                                    return matchesSearch && matchesTag;
                                }).map((prompt) => (

                                    <div
                                        className="baseline-card"
                                        key={prompt.file}
                                    >

                                        <div className="baseline-icon">
                                            ◇
                                        </div>

                                        <div className="baseline-details">

                                            <div className="baseline-top">

                                                <h3>
                                                    {prompt.name}
                                                </h3>

                                                <span className="baseline-date">

                                                    {prompt.updatedAt
                                                        ? new Date(
                                                            prompt.updatedAt
                                                        ).toLocaleString()
                                                        : "Unknown date"}

                                                </span>

                                            </div>

                                            <p>
                                                {prompt.content
                                                    ? prompt.content.substring(
                                                        0,
                                                        140
                                                    )
                                                    : ""}
                                                {prompt.content &&
                                                prompt.content.length > 140
                                                    ? "..."
                                                    : ""}
                                            </p>

                                            {/* Tags row */}
                                            {prompt.tags && prompt.tags.length > 0 && (
                                                <div className="prompt-tags-row">
                                                    {prompt.tags.map((tag, ti) => (
                                                        <span className="prompt-tag-pill" key={ti}>{tag}</span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="baseline-actions">

                                                <button
                                                    className="view-btn"
                                                    onClick={() =>
                                                        loadPromptIntoEditor(
                                                            prompt
                                                        )
                                                    }
                                                >
                                                    Load into Editor
                                                </button>

                                                <button
                                                    className={prompt.shareToken ? "share-btn shared" : "share-btn"}
                                                    onClick={() => handleSharePrompt(prompt.name)}
                                                    disabled={sharingPrompt === prompt.name}
                                                    title={prompt.shareToken ? "Manage share link" : "Create share link"}
                                                >
                                                    {sharingPrompt === prompt.name
                                                        ? "..."
                                                        : prompt.shareToken
                                                        ? "🔗 Shared"
                                                        : "🔗 Share"}
                                                </button>

                                                <button
                                                    className="delete-baseline-btn"
                                                    onClick={() =>
                                                        deleteSavedPrompt(
                                                            prompt.name
                                                        )
                                                    }
                                                >
                                                    Delete
                                                </button>

                                            </div>

                                        </div>

                                    </div>

                                ))}

                            </div>
                        )}

                    </section>

                ) : (

                    <section className="editor-card">

                        <div className="editor-header">

                            <div>

                                <div className="editor-title">
                                    Prompt Editor
                                </div>

                                <div className="editor-subtitle">
                                    Create and manage your AI instructions
                                </div>

                            </div>

                            <div className="draft-badge">

                                <span></span>

                                {saved ? "SAVED" : "DRAFT"}

                            </div>

                        </div>

                        <div className="form-area">

                            <div className="field">

                                <label>PROMPT NAME</label>

                                <input
                                    type="text"
                                    placeholder="e.g. support-bot"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        setSaved(false);
                                    }}
                                />

                            </div>

                            <div className="field">
                                <label>TAGS (comma separated)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. greeting, support"
                                    value={tags}
                                    onChange={(e) => {
                                        setTags(e.target.value);
                                        setSaved(false);
                                    }}
                                />
                            </div>

                            <div className="field">

                                <div className="label-row">

                                    <label>
                                        SYSTEM INSTRUCTIONS
                                    </label>

                                    <span>
                                        Markdown supported
                                    </span>

                                </div>

                                <div className="editor-wrapper">

                                    <div className="line-numbers">

                                        01<br />
                                        02<br />
                                        03<br />
                                        04<br />
                                        05<br />
                                        06<br />
                                        07<br />
                                        08

                                    </div>

                                    <textarea
                                        placeholder="Write your AI system instructions here..."
                                        value={content}
                                        onChange={(e) => {
                                            setContent(e.target.value);
                                            setSaved(false);
                                        }}
                                    />

                                </div>

                            {/* Token & Cost Estimator Widget */}
                            <div className="cost-estimator-widget">
                                <div className="estimator-metric">
                                    <span className="metric-label">ESTIMATED TOKENS</span>
                                    <strong className="metric-value">{estimateTokens(content)} tokens</strong>
                                </div>
                                <div className="estimator-divider"></div>
                                <div className="estimator-metric">
                                    <span className="metric-label">COST PER 1K EXEC.</span>
                                    <strong className="metric-value">${((estimateTokens(content) * 0.0025)).toFixed(4)}</strong>
                                </div>
                                <div className="estimator-divider"></div>
                                <div className="estimator-metric estimator-meter-box">
                                    <div className="meter-header">
                                        <span className="metric-label">TOKEN EFFICIENCY</span>
                                        <span className="meter-status" style={{ color: estimateTokens(content) <= 250 ? '#22c55e' : estimateTokens(content) <= 550 ? '#3b82f6' : '#f59e0b' }}>
                                            {estimateTokens(content) <= 250 ? '● Optimal' : estimateTokens(content) <= 550 ? '● Standard' : '▲ High Volume'}
                                        </span>
                                    </div>
                                    <div className="meter-track">
                                        <div
                                            className="meter-fill"
                                            style={{
                                                width: `${Math.min(100, Math.max(12, Math.round((estimateTokens(content) / 800) * 100)))}%`,
                                                background: estimateTokens(content) <= 250 ? 'linear-gradient(90deg, #22c55e, #10b981)' : estimateTokens(content) <= 550 ? 'linear-gradient(90deg, #3b82f6, #06b6d4)' : 'linear-gradient(90deg, #f59e0b, #ef4444)'
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="editor-footer">

                            <div className="editor-info">

                                    <span>
                                        ● Ready to save
                                    </span>

                                    <span>
                                        {content.length} characters
                                    </span>

                                </div>

                                <div className="actions">

                                    <button
                                        type="button"
                                        className="magic-polish-btn"
                                        onClick={handleOptimizePrompt}
                                        disabled={optimizingPrompt}
                                        title="Auto-refine prompt structure & rules using AI"
                                    >
                                        {optimizingPrompt ? '⏳ Optimizing...' : '🪄 Magic Polish'}
                                    </button>

                                    <button
                                        type="button"
                                        className="compare-models-btn"
                                        onClick={executeMultiModel}
                                        title="Compare responses across GPT-4o, Claude 3.5 & Gemini"
                                    >
                                        ⚔️ Compare Models
                                    </button>

                                    <button
                                        type="button"
                                        className="browse-templates-btn"
                                        onClick={openTemplates}
                                        title="Load starter prompt template"
                                    >
                                        📚 Templates
                                    </button>

                                    <button
                                        className="run-llm-btn"
                                        style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '4px', padding: '0 16px', fontWeight: '500', cursor: 'pointer' }}
                                        onClick={executeLLM}
                                    >
                                        🤖 Run LLM
                                    </button>

                                    <button
                                        className="clear-btn"
                                        onClick={clearPrompt}
                                    >
                                        Clear
                                    </button>

                                    <button
                                        className="snapshot-btn"
                                        onClick={createSnapshot}
                                    >
                                        ◈ Snapshot
                                    </button>

                                    <button
                                        className="baseline-btn"
                                        onClick={saveAsBaseline}
                                    >
                                        ▣ Save as Baseline
                                    </button>

                                    <button
                                        className="save-btn"
                                        onClick={() => savePrompt()}
                                    >
                                        <span>↗</span>
                                        Save Prompt
                                    </button>

                                </div>

                            </div>

                        </div>

                    </section>
                )}

                {message && (

                    <div
                        className={
                            saved
                                ? "success-message"
                                : "error-message"
                        }
                    >

                        <span>
                            {saved ? "✓" : "!"}
                        </span>

                        {message}

                    </div>

                )}

                {showTemplates ? (
                    <section className="regression-page">
                        <div className="regression-header">
                            <div>
                                <div className="editor-title">📚 Starter Prompt Templates</div>
                                <div className="editor-subtitle">Production-ready prompt engineering patterns for enterprise AI</div>
                            </div>
                            <button className="back-btn" onClick={backToEditor}>← Back to Editor</button>
                        </div>

                        {loadingTemplates ? (
                            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                                ⏳ Loading prompt templates...
                            </div>
                        ) : (
                            <div className="template-grid">
                                {templatesList.map(tpl => (
                                    <div key={tpl.id} className="template-card">
                                        <div className="template-card-header">
                                            <span className="template-category">{tpl.category}</span>
                                            <h3>{tpl.name}</h3>
                                        </div>
                                        <p className="template-description">{tpl.description}</p>
                                        <div className="template-tags">
                                            {tpl.tags.map((t, idx) => (
                                                <span key={idx} className="tag-pill">#{t}</span>
                                            ))}
                                        </div>
                                        <div className="template-footer">
                                            <button
                                                className="save-btn"
                                                style={{ width: '100%', marginTop: '12px', justifyContent: 'center' }}
                                                onClick={() => loadTemplateIntoEditor(tpl)}
                                            >
                                                ⚡ Load into Editor
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                ) : showAnalytics ? (
                    <section className="regression-page">
                        <div className="regression-header">
                            <div>
                                <div className="editor-title">Analytics Dashboard</div>
                                <div className="editor-subtitle">View test pass rates and usage statistics</div>
                            </div>
                            <button className="back-btn" onClick={backToEditor}>← Back to Editor</button>
                        </div>
                        <div className="info-grid">
                            {analyticsData.map(stat => (
                                <div key={stat.id} className="info-card">
                                    <div className="info-card-icon">📊</div>
                                    <div>
                                        <h3>{stat.promptName}</h3>
                                        <p>Passed: {stat.passedTests} | Failed: {stat.failedTests}</p>
                                        <small>{new Date(stat.timestamp).toLocaleString()}</small>
                                    </div>
                                </div>
                            ))}
                            {analyticsData.length === 0 && <div className="baseline-empty"><p>No analytics data available yet. Run some regression tests!</p></div>}
                        </div>
                    </section>
                ) : !showRegression &&
                    !showBaselines &&
                    !showPrompts && !showAnalytics && !showTemplates && (

                        <section className="info-grid">

                            <div className="info-card">

                                <div className="info-card-icon">
                                    ◈
                                </div>

                                <div>

                                    <h3>
                                        Version Control
                                    </h3>

                                    <p>
                                        Track every prompt snapshot and
                                        understand how your instructions evolve.
                                    </p>

                                </div>

                            </div>

                            <div className="info-card">

                                <div className="info-card-icon">
                                    ✓
                                </div>

                                <div>

                                    <h3>
                                        Regression Ready
                                    </h3>

                                    <p>
                                        Test prompt changes against your
                                        previously accepted baseline.
                                    </p>

                                </div>

                            </div>

                        </section>
                    )}

            </main>

            {selectedVersion && (

                <div
                    className="version-modal-overlay"
                    onClick={closeVersion}
                >

                    <div
                        className="version-modal"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div className="version-modal-header">

                            <div>

                                <div className="modal-version-title">

                                    VERSION{" "}
                                    {selectedVersion.versionNumber}

                                    {selectedVersion.versionNumber === 1 && (
                                        <span className="initial-badge">
                                            INITIAL
                                        </span>
                                    )}

                                </div>

                                <h2>
                                    {selectedVersion.promptName}
                                </h2>

                                <span>
                                    {selectedVersion.id}
                                </span>

                            </div>

                            <button
                                className="modal-close"
                                onClick={closeVersion}
                            >
                                ×
                            </button>

                        </div>

                        <div className="version-modal-content">

                            <p className="modal-label">
                                PROMPT CONTENT
                            </p>

                            <pre>
                                {selectedVersion.content}
                            </pre>

                        </div>

                        <div className="version-modal-footer">

                            <span>
                                {selectedVersion.createdAt
                                    ? new Date(
                                        selectedVersion.createdAt
                                    ).toLocaleString()
                                    : ""}
                            </span>

                            <div className="modal-actions">

                                <button
                                    className="restore-btn"
                                    onClick={() =>
                                        restoreVersion(selectedVersion)
                                    }
                                >
                                    ↻ Restore Version
                                </button>

                                <button
                                    className="back-btn"
                                    onClick={closeVersion}
                                >
                                    Close
                                </button>

                            </div>

                        </div>

                    </div>

                </div>
            )}

            {selectedBaseline && (

                <div
                    className="version-modal-overlay"
                    onClick={closeBaselineView}
                >

                    <div
                        className="version-modal"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div className="version-modal-header">

                            <div>

                                <div className="modal-version-title">
                                    BASELINE
                                </div>

                                <h2>
                                    {selectedBaseline.name}
                                </h2>

                                <span>
                                    {selectedBaseline.id}
                                </span>

                            </div>

                            <button
                                className="modal-close"
                                onClick={closeBaselineView}
                            >
                                ×
                            </button>

                        </div>

                        <div className="version-modal-content">

                            <p className="modal-label">
                                PROMPT CONTENT
                            </p>

                            <pre>
                                {selectedBaseline.content}
                            </pre>

                        </div>

                        <div className="version-modal-footer">

                            <span>
                                {selectedBaseline.createdAt
                                    ? new Date(
                                        selectedBaseline.createdAt
                                    ).toLocaleString()
                                    : ""}
                            </span>

                            <div className="modal-actions">

                                <button
                                    className="restore-btn"
                                    onClick={() =>
                                        restoreBaseline(
                                            selectedBaseline
                                        )
                                    }
                                >
                                    ↻ Restore Baseline
                                </button>

                                <button
                                    className="back-btn"
                                    onClick={closeBaselineView}
                                >
                                    Close
                                </button>

                            </div>

                        </div>

                    </div>

                </div>
            )}

            {compareVersion && (

                <div
                    className="version-modal-overlay"
                    onClick={closeCompare}
                >

                    <div
                        className="compare-modal"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div className="version-modal-header">

                            <div>

                                <div className="modal-version-title">

                                    VERSION{" "}
                                    {compareVersion.previous?.versionNumber || 1}

                                    {" → "}

                                    VERSION{" "}
                                    {compareVersion.current?.versionNumber}

                                </div>

                                <h2>
                                    Prompt Changes
                                </h2>

                                <span>
                                    {compareVersion.current?.promptName}
                                </span>

                            </div>

                            <button
                                className="modal-close"
                                onClick={closeCompare}
                            >
                                ×
                            </button>

                        </div>

                        <div className="compare-content">

                            <div className="compare-column">

                                <div className="compare-title old">
                                    VERSION{" "}
                                    {compareVersion.previous?.versionNumber || 1}
                                </div>

                                <pre>
                                    {compareVersion.previous?.content || "(Initial Version)"}
                                </pre>

                            </div>

                            <div className="compare-column">

                                <div className="compare-title new">
                                    VERSION{" "}
                                    {compareVersion.current?.versionNumber}
                                </div>

                                <pre>
                                    {compareVersion.current?.content}
                                </pre>

                            </div>

                        </div>

                        <div className="compare-summary">

                            <strong>What changed?</strong>

                            <span>
                                {getChangeSummary(
                                    compareVersion.current,
                                    compareVersion.previous
                                )}
                            </span>

                        </div>

                        <div className="version-modal-footer">

                            <span>
                                Compare previous version with current version
                            </span>

                            <div className="modal-actions">

                                <button
                                    className="back-btn"
                                    onClick={closeCompare}
                                >
                                    Close
                                </button>

                            </div>

                        </div>

                    </div>

                </div>
            )}

            {showSettings && (
                <div className="version-modal-overlay" onClick={() => setShowSettings(false)}>
                    <div className="version-modal" onClick={e => e.stopPropagation()}>
                        <div className="version-modal-header">
                            <div className="modal-version-title">LLM SETTINGS</div>
                            <button className="modal-close" onClick={() => setShowSettings(false)}>×</button>
                        </div>
                        <div className="version-modal-content">
                            <div className="field">
                                <label>PROVIDER</label>
                                <select value={llmProvider} onChange={e => setLlmProvider(e.target.value)} style={{width: '100%', padding: '12px', background: 'var(--code-bg)', color: 'var(--text-h)', border: '1px solid var(--border)', borderRadius: '4px'}}>
                                    <option value="openai">OpenAI</option>
                                    <option value="anthropic">Anthropic</option>
                                </select>
                            </div>
                            <div className="field" style={{marginTop: '16px'}}>
                                <label>MODEL</label>
                                <input type="text" value={llmModel} onChange={e => setLlmModel(e.target.value)} style={{width: '100%'}} placeholder="e.g. gpt-4 or claude-3-5-sonnet-20240620" />
                            </div>
                            <div className="field" style={{marginTop: '16px'}}>
                                <label>API KEY</label>
                                <input type="password" value={llmApiKey} onChange={e => setLlmApiKey(e.target.value)} style={{width: '100%'}} />
                            </div>
                        </div>
                        <div className="version-modal-footer">
                            <div className="modal-actions">
                                <button className="save-btn" onClick={() => setShowSettings(false)}>Save Settings</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {(runningLLM || llmResult) && (
                <div className="version-modal-overlay" onClick={() => { if (!runningLLM) setLlmResult(""); }}>
                    <div className="version-modal" onClick={e => e.stopPropagation()}>
                        <div className="version-modal-header">
                            <div className="modal-version-title">LLM EXECUTION</div>
                            {!runningLLM && <button className="modal-close" onClick={() => setLlmResult("")}>×</button>}
                        </div>
                        <div className="version-modal-content">
                            {runningLLM ? (
                                <div style={{textAlign: 'center', padding: '40px', color: 'var(--text-h)'}}>
                                    <div className="loading-spinner" style={{fontSize: '20px'}}>⏳ Running your prompt against {llmModel}...</div>
                                </div>
                            ) : (
                                <pre style={{whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', color: 'var(--text-h)', background: 'var(--code-bg)', padding: '16px', borderRadius: '4px'}}>{llmResult}</pre>
                            )}
                        </div>
                        {!runningLLM && (
                            <div className="version-modal-footer">
                                <div className="modal-actions">
                                    <button className="back-btn" onClick={() => setLlmResult("")}>Close</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showOptimizerModal && optimizedData && (
                <div className="version-modal-overlay" onClick={() => setShowOptimizerModal(false)}>
                    <div className="version-modal optimizer-modal" onClick={e => e.stopPropagation()}>
                        <div className="version-modal-header">
                            <div>
                                <div className="modal-version-title">AI PROMPT OPTIMIZER</div>
                                <h2>🪄 Magic Polish Results</h2>
                            </div>
                            <button className="modal-close" onClick={() => setShowOptimizerModal(false)}>×</button>
                        </div>
                        <div className="version-modal-content">
                            <div className="optimizer-improvements">
                                <h4 style={{ margin: '0 0 10px', color: 'var(--text-primary)' }}>✨ Enhancements Applied:</h4>
                                <ul className="improvements-list">
                                    {optimizedData.improvements.map((imp, i) => (
                                        <li key={i}>✓ {imp}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="compare-content" style={{ marginTop: '16px' }}>
                                <div className="compare-column">
                                    <div className="compare-title old">Original Draft</div>
                                    <pre>{optimizedData.originalContent}</pre>
                                </div>
                                <div className="compare-column">
                                    <div className="compare-title new">Optimized Structure</div>
                                    <pre>{optimizedData.optimizedContent}</pre>
                                </div>
                            </div>
                        </div>
                        <div className="version-modal-footer">
                            <span className="footer-hint">Structured with role definitions, output bounds & anti-hallucination rules</span>
                            <div className="modal-actions">
                                <button className="save-btn" onClick={applyOptimizedPrompt}>
                                    🪄 Apply to Editor
                                </button>
                                <button className="back-btn" onClick={() => setShowOptimizerModal(false)}>
                                    Discard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showMultiModelModal && (
                <div className="version-modal-overlay" onClick={() => { if (!runningMultiModel) setShowMultiModelModal(false); }}>
                    <div className="version-modal multi-model-modal" onClick={e => e.stopPropagation()}>
                        <div className="version-modal-header">
                            <div>
                                <div className="modal-version-title">MULTI-MODEL COMPARISON</div>
                                <h2>⚔️ Side-by-Side Playground</h2>
                            </div>
                            {!runningMultiModel && <button className="modal-close" onClick={() => setShowMultiModelModal(false)}>×</button>}
                        </div>
                        <div className="version-modal-content">
                            {runningMultiModel ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    <div className="loading-spinner" style={{ fontSize: '18px' }}>
                                        ⚡ Executing prompt concurrently across GPT-4o, Claude 3.5 Sonnet & Gemini 1.5 Pro...
                                    </div>
                                </div>
                            ) : (
                                <div className="multi-model-grid">
                                    {multiModelResults.map((res, i) => (
                                        <div key={i} className="model-compare-card">
                                            <div className="model-card-header">
                                                <div>
                                                    <strong className="model-provider-title">{res.provider}</strong>
                                                    <span className="model-name-badge">{res.model}</span>
                                                </div>
                                                <span className="quality-pill">{res.qualityScore} Match</span>
                                            </div>
                                            <div className="model-metrics-row">
                                                <span>⚡ {res.latencyMs} ms</span>
                                                <span>🪙 {res.inputTokens + res.outputTokens} tok</span>
                                                <span>💰 {res.costEst}</span>
                                            </div>
                                            <pre className="model-output-box">{res.output}</pre>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {!runningMultiModel && (
                            <div className="version-modal-footer">
                                <span>Concurrent multi-model execution completed</span>
                                <div className="modal-actions">
                                    <button className="back-btn" onClick={() => setShowMultiModelModal(false)}>Close Playground</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ============================================
                SHARE MODAL
            ============================================ */}
            {shareModal && (
                <div className="share-modal-overlay" onClick={() => { setShareModal(null); setCopySuccess(false); }}>
                    <div className="share-modal" onClick={e => e.stopPropagation()}>
                        <div className="share-modal-header">
                            <div>
                                <div className="share-modal-label">COLLABORATION</div>
                                <h2>🔗 Share Prompt</h2>
                            </div>
                            <button className="modal-close" onClick={() => { setShareModal(null); setCopySuccess(false); }}>×</button>
                        </div>

                        <div className="share-modal-body">
                            <div className="share-prompt-name">
                                <span className="share-prompt-icon">◇</span>
                                <strong>{shareModal.promptName}</strong>
                            </div>

                            <p className="share-description">
                                Anyone with this link can view this prompt in a read-only viewer — no login required.
                            </p>

                            <div className="share-url-row">
                                <input
                                    type="text"
                                    readOnly
                                    value={shareModal.shareUrl}
                                    className="share-url-input"
                                    onClick={e => e.target.select()}
                                />
                                <button
                                    className={copySuccess ? "copy-btn copy-success" : "copy-btn"}
                                    onClick={() => handleCopyShareUrl(shareModal.shareUrl)}
                                >
                                    {copySuccess ? "✓ Copied!" : "Copy"}
                                </button>
                            </div>

                            {shareModal.sharedAt && (
                                <div className="share-meta">
                                    🕒 Shared {new Date(shareModal.sharedAt).toLocaleString()}
                                </div>
                            )}

                            <div className="share-info-box">
                                <span>💡</span>
                                <span>The link stays active until you revoke it. Viewers see your prompt content but cannot edit it.</span>
                            </div>
                        </div>

                        <div className="share-modal-footer">
                            <button
                                className="revoke-btn"
                                onClick={() => handleRevokeShare(shareModal.promptName)}
                            >
                                🗑 Revoke Link
                            </button>
                            <button
                                className="close-share-btn"
                                onClick={() => { setShareModal(null); setCopySuccess(false); }}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default App;